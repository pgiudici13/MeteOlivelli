"""CLI: python -m uploader --config <percorso assoluto>."""

import argparse
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import shutil
import sqlite3
import time

from .core import Halt, InstanceLock, Store, deliver, validate_config


def main():
    parser = argparse.ArgumentParser(description="Uploader MeteOlivelli, adattatore CSV provvisorio v1")
    parser.add_argument("--config", required=True, help="JSON locale senza token")
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument("--initialize", action="store_true", help="Solo per una nuova sorgente, nessun invio")
    actions.add_argument("--status", action="store_true", help="Conteggi locali senza rete o token")
    actions.add_argument("--resume", action="store_true", help="Riabilita invio dopo correzione della causa")
    actions.add_argument("--replay-confirmed", action="store_true", help="Ripropone gli stessi ID dopo restore DB")
    actions.add_argument("--once", action="store_true", help="Un ciclo, trattato come storico")
    args = parser.parse_args()
    logger = logging.getLogger("meteolivelli.uploader")
    logger.setLevel(logging.INFO)
    logger.addHandler(logging.StreamHandler())
    try:
        with open(args.config, encoding="utf-8") as file:
            config = validate_config(json.load(file))
        with InstanceLock(config["state_dir"]):
            handler = RotatingFileHandler(Path(config["state_dir"]) / "uploader.log",
                                          maxBytes=262144, backupCount=3, encoding="utf-8")
            handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
            logger.addHandler(handler)
            store = Store(config, initialize=args.initialize)
            try:
                if args.initialize:
                    logger.info("Registro inizializzato; nessuna riga inviata.")
                    return 0
                if args.resume:
                    store.resume()
                if args.replay_confirmed:
                    store.replay_confirmed()
                if args.status or args.resume or args.replay_confirmed:
                    logger.info("Stato: %s; sospensione: %s", store.counts(), store.meta()["suspended"])
                    return 0
                token = os.environ.get("STATION_INGEST_TOKEN", "")
                if len(token) < 32 or not token.isascii() or any(c.isspace() for c in token):
                    raise Halt("STATION_INGEST_TOKEN assente o non valido: invio non avviato.")
                previous_size = os.stat(config["csv_path"]).st_size
                previous_tick = None
                last_status = None
                while True:
                    tick = time.monotonic()
                    # Dopo sospensione/timeout lungo l'ora di completamento non è attestabile.
                    live_from = (previous_size if not args.once and previous_tick is not None
                                 and tick - previous_tick <= 10 else None)
                    previous_size = os.stat(config["csv_path"]).st_size
                    previous_tick = tick
                    if shutil.disk_usage(config["state_dir"]).free < 64 * 1024 * 1024:
                        raise Halt("Spazio disponibile inferiore a 64 MiB: fermo senza cancellare la coda.")
                    store.capture(live_from=live_from)
                    deliver(store, token, time.time())
                    status = (store.counts(), store.meta()["suspended"])
                    if status != last_status:
                        logger.info("Stato: %s; sospensione: %s", *status)
                        last_status = status
                    if status[1]:
                        raise Halt("Invio sospeso: verificare configurazione e usare --resume dopo la correzione.")
                    if args.once:
                        return 0
                    time.sleep(2)
            finally:
                store.db.close()
    except KeyboardInterrupt:
        logger.info("Uploader arrestato; registro conservato.")
        return 0
    except Halt as exc:
        logger.error("%s", exc)
        return 2
    except (OSError, sqlite3.Error, ValueError, TypeError, KeyError):
        # Mai stampare eccezioni di rete/JSON/SQLite: possono includere dati arbitrari.
        logger.error("Operazione non riuscita: controllare file, permessi, configurazione e integrità dello stato.")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
