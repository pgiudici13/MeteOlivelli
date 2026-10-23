"""Acquisizione provvisoria v1, SQLite e trasporto; solo libreria standard Python."""

import csv
import hashlib
from http.client import HTTPException
import io
import json
import math
import os
from pathlib import Path
import random
import re
import sqlite3
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib import error, parse, request
import uuid


class Halt(Exception):
    """Intervento richiesto; messaggi controllati, senza dati o credenziali."""


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def validate_config(config):
    required = {"csv_path", "state_dir", "source_id", "endpoint", "delimiter",
                "decimal_separator", "encoding", "empty_measurement", "header", "live_verified"}
    if not required.issubset(config) or set(config) - required - {"acquisition_kind"}:
        raise Halt("Configurazione incompleta o con campi sconosciuti.")
    if not all(isinstance(config[k], str) for k in required - {"header", "live_verified"}):
        raise Halt("Tipo di configurazione non valido.")
    if config["delimiter"] not in (",", ";", "\t", "|") or config["decimal_separator"] not in (".", ","):
        raise Halt("Dialetto CSV non valido.")
    if config["encoding"] not in ("utf-8", "cp1252") or config["empty_measurement"] not in ("reject", "null"):
        raise Halt("Encoding o gestione campi vuoti non supportati.")
    if type(config["live_verified"]) is not bool:
        raise Halt("Conferma temporale non valida.")
    kind = config.get("acquisition_kind", "historical")
    if kind not in ("live", "historical", "synthetic"):
        raise Halt("Tipo di acquisizione non valido.")
    if kind == "synthetic" and config["live_verified"]:
        raise Halt("Le misure sintetiche non possono essere marcate come live verificato.")
    if config["header"] is not None and (not isinstance(config["header"], list) or
            len(config["header"]) != 4 or not all(isinstance(v, str) for v in config["header"])):
        raise Halt("Intestazione esplicita di quattro campi richiesta, oppure null.")
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,63}", config["source_id"]):
        raise Halt("Identificatore sorgente non valido.")
    try:
        endpoint = parse.urlsplit(config["endpoint"])
        port = endpoint.port
    except ValueError:
        raise Halt("Endpoint non valido.") from None
    if (endpoint.scheme != "https" or not endpoint.hostname or endpoint.username or endpoint.password
            or endpoint.query or endpoint.fragment or port not in (None, 443)
            or not endpoint.path.endswith("/functions/v1/ingest-measurement")):
        raise Halt("Richiesto endpoint ingestione HTTPS senza credenziali o query.")
    if not Path(config["csv_path"]).is_absolute() or not Path(config["state_dir"]).is_absolute():
        raise Halt("Percorsi assoluti richiesti sul sistema di esecuzione.")
    return config


def parse_row(raw, config, ingestion_id, captured_at):
    """Dialetto obbligatorio; nessuna inferenza del formato reale o correzione dei numeri."""
    try:
        text = raw.decode(config["encoding"])
        if any(c in text for c in "\r\n\ufeff"):
            raise ValueError
        # Stessa grammatica delle virgolette del parser TypeScript v1.
        pattern = r'(?:"(?:[^"\r\n]|"")*"|[^"\r\n' + re.escape(config["delimiter"]) + r']*)'
        if not re.fullmatch(pattern + (re.escape(config["delimiter"]) + pattern) * 3, text):
            raise ValueError
        cells = next(csv.reader(io.StringIO(text), delimiter=config["delimiter"], strict=True))
        if len(cells) != 4:
            raise ValueError
        values = []
        decimal = re.escape(config["decimal_separator"])
        numeric = rf"[+-]?(?:\d+(?:{decimal}\d+)?|{decimal}\d+)(?:[eE][+-]?\d+)?"
        for index, cell in enumerate(cells):
            token = cell.strip()
            if not token and index > 0 and config["empty_measurement"] == "null":
                values.append(None)
                continue
            if not re.fullmatch(numeric, token, flags=re.ASCII):
                raise ValueError
            normalized = token.replace(",", ".")
            value = float(normalized)
            if not math.isfinite(value) or (value == 0 and re.search(r"[1-9]", re.split("[eE]", normalized)[0])):
                raise ValueError
            values.append(value)
        if not 0 <= values[0] <= 9007199254740991:
            raise ValueError
    except (UnicodeError, ValueError, csv.Error, StopIteration):
        return None, "csv_non_valido"
    kind = config.get("acquisition_kind", "historical")
    if kind == "synthetic":
        captured_at = captured_at or utc_now()
    payload = {
        "schema_version": 1, "source_id": config["source_id"], "ingestion_id": ingestion_id,
        "arduino_seconds": values[0], "temperature_c": values[1], "humidity_pct": values[2],
        "pressure_hpa": values[3], "acquisition_kind": kind if kind == "synthetic" else
            ("live" if captured_at else "historical"),
        "captured_at": captured_at, "measured_at": None,
    }
    if kind == "synthetic":
        payload["_provenance"] = {"kind": "synthetic"}
    return payload, None


class InstanceLock:
    """Lock del sistema operativo: si libera anche dopo un crash, file mai rimosso."""

    def __init__(self, directory):
        self.path = Path(directory) / "uploader.lock"

    def __enter__(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.file = self.path.open("a+b")
        self.file.seek(0, 2)
        if self.file.tell() == 0:
            self.file.write(b"0")
            self.file.flush()
        self.file.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.file.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self.file.close()
            raise Halt("Uploader già attivo o lock non disponibile.") from None
        return self

    def __exit__(self, *args):
        self.file.close()


def identity(stat):
    if not stat.st_ino:
        raise Halt("Identità del file non disponibile: verificare il filesystem.")
    return [stat.st_dev, stat.st_ino]


def anchors(file, offset):
    """Controlli limitati a testa e coda già consumate, senza rileggere tutto il CSV."""
    file.seek(0)
    head = file.read(min(4096, offset))
    file.seek(max(0, offset - 4096))
    tail = file.read(min(4096, offset))
    return hashlib.sha256(head + tail).hexdigest()


class Store:
    def __init__(self, config, initialize=False):
        self.config = config
        directory = Path(config["state_dir"])
        self.path = directory / "outbox.sqlite3"
        marker = directory / "initialized"
        self.signature = json.dumps({k: v for k, v in config.items() if k != "live_verified"}, sort_keys=True)
        if initialize:
            if self.path.exists() or marker.exists():
                raise Halt("Stato già presente: inizializzazione rifiutata.")
            directory.mkdir(parents=True, exist_ok=True)
            # Il marcatore precede il DB: un crash non autorizza una nuova importazione.
            with marker.open("x") as file:
                file.write("Non cancellare: ripristinare SQLite e identità insieme.\n")
                file.flush()
                os.fsync(file.fileno())
            with self.path.open("xb"):
                pass
        if not self.path.is_file() or not marker.is_file():
            raise Halt("Stato assente: ripristino richiesto; inizializzazione solo per una sorgente nuova.")
        self.db = sqlite3.connect(self.path.as_uri() + "?mode=rw", uri=True)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA synchronous=FULL")
        try:
            if initialize:
                self.db.executescript("""
                    CREATE TABLE metadata (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
                    CREATE TABLE events (
                        id TEXT PRIMARY KEY, generation TEXT NOT NULL, start_offset INTEGER NOT NULL,
                        raw BLOB NOT NULL, payload TEXT, state TEXT NOT NULL,
                        reason TEXT, attempts INTEGER NOT NULL DEFAULT 0,
                        next_attempt REAL NOT NULL DEFAULT 0, receipt TEXT,
                        UNIQUE(generation,start_offset));
                    CREATE INDEX events_due ON events(state,next_attempt);
                """)
                with open(config["csv_path"], "rb") as file:
                    stat = os.fstat(file.fileno())
                    meta = {"version": 1, "signature": self.signature, "identity": identity(stat),
                            "generation": str(uuid.uuid4()), "offset": 0,
                            "anchor": anchors(file, 0), "mtime": stat.st_mtime_ns,
                            "suspended": None}
                with self.db:
                    self.db.execute("INSERT INTO metadata VALUES(1,?)", (json.dumps(meta),))
            if self.db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise Halt("Stato SQLite corrotto: ripristino richiesto.")
            meta = self.meta()
            if meta["version"] != 1 or meta["signature"] != self.signature:
                raise Halt("Configurazione diversa dal registro: riconciliazione richiesta.")
        except BaseException:
            self.db.close()
            raise

    def meta(self):
        return json.loads(self.db.execute("SELECT value FROM metadata WHERE id=1").fetchone()[0])

    def save_meta(self, meta):
        self.db.execute("UPDATE metadata SET value=? WHERE id=1", (json.dumps(meta),))

    def capture(self, live_from=None, now=utc_now):
        meta = self.meta()
        with open(self.config["csv_path"], "rb") as file:
            before = os.fstat(file.fileno())
            if (identity(before) != meta["identity"] or before.st_size < meta["offset"]
                    or anchors(file, meta["offset"]) != meta["anchor"]
                    or (before.st_size == meta["offset"] and before.st_mtime_ns != meta["mtime"])):
                raise Halt("CSV sostituito, troncato o riscritto: fermo per riconciliazione, nessun replay automatico.")
            file.seek(meta["offset"])
            rows = []
            for _ in range(100):
                start = file.tell()
                raw = file.readline(65537)
                if len(raw) > 65536:
                    raise Halt("Riga oltre 64 KiB: acquisizione ferma, originale da verificare.")
                if not raw.endswith(b"\n"):
                    break  # EOF parziale resta nel CSV; cursore invariato.
                rows.append((start, raw, file.tell()))
            after = os.fstat(file.fileno())
            if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                return 0  # writer ancora attivo: attendere un'altra osservazione.
            if identity(os.stat(self.config["csv_path"])) != meta["identity"]:
                raise Halt("CSV cambiato durante la lettura: riconciliazione richiesta.")
            captured = now() if (self.config["live_verified"] and live_from is not None and
                                 len(rows) == 1 and rows[0][0] >= live_from) else None
            with self.db:
                for start, raw, end in rows:
                    event_id = str(uuid.uuid4())
                    body = raw[:-1].removesuffix(b"\r")
                    header = self.config["header"]
                    expected = None if header is None else header
                    is_header = False
                    if start == 0 and expected is not None:
                        try:
                            cells = next(csv.reader([body.decode(self.config["encoding"])],
                                                    delimiter=self.config["delimiter"], strict=True))
                            is_header = cells == expected
                        except (UnicodeError, csv.Error, StopIteration):
                            pass
                        if not is_header:
                            raise Halt("Intestazione diversa dalla configurazione: nessun cursore avanzato.")
                    payload, reason = (None, None) if is_header else parse_row(body, self.config, event_id, captured)
                    self.db.execute("INSERT INTO events(id,generation,start_offset,raw,payload,state,reason) "
                                    "VALUES(?,?,?,?,?,?,?)", (event_id, meta["generation"], start, raw,
                                    json.dumps(payload, allow_nan=False) if payload else None,
                                    "header" if is_header else "pending" if payload else "quarantine", reason))
                    meta["offset"] = end
                meta["anchor"] = anchors(file, meta["offset"])
                # Una coda parziale non equivale a una modifica della porzione già letta.
                meta["mtime"] = before.st_mtime_ns
                self.save_meta(meta)
        return len(rows)

    def counts(self):
        return {row[0]: row[1] for row in self.db.execute("SELECT state,count(*) FROM events GROUP BY state")}

    def resume(self):
        with self.db:
            meta = self.meta()
            meta["suspended"] = None
            self.save_meta(meta)

    def replay_confirmed(self):
        with self.db:
            self.db.execute("UPDATE events SET state='pending',next_attempt=0 WHERE state='confirmed'")


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Mai inoltrare il token ad altro indirizzo.


def https_send(endpoint, token, payload):
    opener = request.build_opener(NoRedirect())
    req = request.Request(endpoint, data=payload.encode("utf-8"), method="POST",
                          headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    try:
        response = opener.open(req, timeout=15)
    except error.HTTPError as response_error:
        response = response_error
    with response:
        body = response.read(65537)
        return response.code, dict(response.headers), body


def retry_delay(attempts, headers, now, jitter=random.random):
    delay = min(300, 2 ** min(attempts, 8)) * (0.5 + jitter() / 2)
    value = next((v for k, v in headers.items() if k.lower() == "retry-after"), "")
    try:
        if re.fullmatch(r"\d+", value):
            after = float(value)
        else:
            after = parsedate_to_datetime(value).timestamp() - now
        if math.isfinite(after):
            delay = max(delay, after)
    except (TypeError, ValueError, OverflowError):
        pass
    return now + delay


def valid_receipt(status, body, payload):
    try:
        receipt = json.loads(body)
        kind = "accepted" if status == 201 else "duplicate"
        timestamp = receipt["received_at"]
        if not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)", timestamp):
            return False
        datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        return (receipt["status"] == receipt["code"] == kind and
                receipt["source_id"] == payload["source_id"] and
                receipt["ingestion_id"] == payload["ingestion_id"] and
                isinstance(receipt["quality_flags"], list))
    except (ValueError, TypeError, KeyError):
        return False


def deliver(store, token, now, send=https_send, limit=20):
    if store.meta()["suspended"]:
        return 0
    rows = store.db.execute("SELECT * FROM events WHERE state='pending' AND next_attempt<=? "
                            "ORDER BY start_offset LIMIT ?", (now, limit)).fetchall()
    for row in rows:
        try:
            status, headers, body = send(store.config["endpoint"], token, row["payload"])
        except (OSError, error.URLError, HTTPException):
            status, headers, body = 0, {}, b""
        state, reason, receipt = "pending", "errore_temporaneo", None
        if status in (200, 201) and len(body) <= 65536 and valid_receipt(status, body, json.loads(row["payload"])):
            state, reason, receipt = "confirmed", None, body.decode("utf-8")
        elif status in (400, 409, 413, 415, 422):
            state, reason = "quarantine", f"http_{status}"
        elif status not in (0, 408, 429) and not 500 <= status <= 599 and status not in (200, 201):
            with store.db:
                meta = store.meta()
                meta["suspended"] = "autenticazione" if status in (401, 403) else "protocollo_http"
                store.save_meta(meta)
            break
        with store.db:
            store.db.execute("UPDATE events SET state=?,reason=?,attempts=attempts+1,next_attempt=?,receipt=? WHERE id=?",
                             (state, reason, retry_delay(row["attempts"], headers, now), receipt, row["id"]))
    return len(rows)
