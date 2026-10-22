"""Tutti i dati e le risposte sono sintetici; nessuna rete o credenziale reale."""

import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
import uuid

from uploader.core import (
    Halt, InstanceLock, NoRedirect, Store, deliver, https_send, parse_row,
    retry_delay, validate_config,
)


class UploaderTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.csv = self.root / "synthetic.csv"
        self.csv.write_bytes(b"1;20;50;1010\r\n")
        self.config = {
            "csv_path": str(self.csv), "state_dir": str(self.root / "state"),
            "source_id": "synthetic-test", "endpoint": "https://example.invalid/functions/v1/ingest-measurement",
            "delimiter": ";", "decimal_separator": ",", "encoding": "utf-8",
            "empty_measurement": "reject", "header": None, "live_verified": False,
        }
        Path(self.config["state_dir"]).mkdir()
        self.stores = []

    def tearDown(self):
        for store in self.stores:
            store.db.close()
        self.temp.cleanup()

    def store(self, initialize=True):
        store = Store(self.config, initialize=initialize)
        self.stores.append(store)
        return store

    def append(self, raw):
        with self.csv.open("ab") as file:
            file.write(raw)

    def events(self, store):
        return store.db.execute("SELECT * FROM events ORDER BY start_offset").fetchall()

    def receipt(self, endpoint, token, raw, status=201):
        data = json.loads(raw)
        kind = "accepted" if status == 201 else "duplicate"
        return status, {}, json.dumps({
            "status": kind, "code": kind, "source_id": data["source_id"],
            "ingestion_id": data["ingestion_id"], "received_at": "2026-10-22T10:00:00.000Z",
            "quality_flags": [],
        }).encode()

    def test_explicit_configuration_and_https_only(self):
        validate_config(self.config)
        for field, value in (("delimiter", ":"), ("header", []), ("encoding", "utf-16"),
                             ("live_verified", "false"), ("source_id", "BAD"),
                             ("endpoint", "http://example.invalid/functions/v1/ingest-measurement"),
                             ("endpoint", "https://user:secret@example.invalid/functions/v1/ingest-measurement"),
                             ("endpoint", self.config["endpoint"] + "?token=placeholder")):
            with self.subTest(field=field, value=value), self.assertRaises(Halt):
                validate_config(dict(self.config, **{field: value}))

    def test_parser_units_null_and_suspicious_values_preserved(self):
        config = dict(self.config, empty_measurement="null")
        data, reason = parse_row(b'"0";-300,5;150;', config, str(uuid.uuid4()), None)
        self.assertIsNone(reason)
        self.assertEqual((data["arduino_seconds"], data["temperature_c"], data["humidity_pct"],
                          data["pressure_hpa"]), (0, -300.5, 150, None))
        self.assertIsNone(data["measured_at"])
        self.assertIsNone(data["captured_at"])
        self.assertEqual(data["acquisition_kind"], "historical")

    def test_parser_rejects_non_numeric_bom_quotes_and_underflow(self):
        for raw in (b"1;NaN;2;3", b"-1;2;3;4", b"1;2;3", b"1;2;3;4;5", b"1;2;;4",
                    b"1;1e309;3;4", b"1;1e-999;3;4", b'1;"2"x;3;4', b'1;2";3;4',
                    b"1;2\n;3;4", b"\xef\xbb\xbf1;2;3;4", b"1;\xff;3;4"):
            with self.subTest(raw=raw):
                self.assertEqual(parse_row(raw, self.config, str(uuid.uuid4()), None),
                                 (None, "csv_non_valido"))

    def test_repeated_rows_and_reset_are_different_events(self):
        self.append(b"1;20;50;1010\n0;20;50;1010\n")
        store = self.store()
        self.assertEqual(store.capture(), 3)
        rows = self.events(store)
        self.assertEqual(len({r["id"] for r in rows}), 3)
        self.assertEqual(store.capture(), 0)
        restarted = self.store(initialize=False)
        self.assertEqual(restarted.capture(), 0)
        self.assertEqual([r["id"] for r in self.events(restarted)], [r["id"] for r in rows])

    def test_partial_line_waits_and_raw_crlf_is_preserved(self):
        self.append(b"2;21")
        store = self.store()
        store.capture()
        self.assertEqual(len(self.events(store)), 1)
        self.assertEqual(self.events(store)[0]["raw"], b"1;20;50;1010\r\n")
        self.assertEqual(store.capture(), 0)
        self.append(b";51;1011\r\n")
        self.assertEqual(store.capture(), 1)

    def test_timestamp_requires_verification_and_single_new_row(self):
        self.config["live_verified"] = True
        store = self.store()
        store.capture()  # prima lettura e backlog sempre storico
        boundary = self.csv.stat().st_size
        self.append(b"2;21;50;1010\n")
        stamp = "2026-10-22T12:00:00.000Z"
        store.capture(live_from=boundary, now=lambda: stamp)
        self.assertEqual(json.loads(self.events(store)[1]["payload"])["captured_at"], stamp)
        boundary = self.csv.stat().st_size
        self.append(b"3;21;50;1010\n4;21;50;1010\n")
        store.capture(live_from=boundary, now=lambda: stamp)
        self.assertTrue(all(json.loads(r["payload"])["captured_at"] is None for r in self.events(store)[2:]))

    def test_preexisting_partial_is_never_dated_live(self):
        self.csv.write_bytes(b"1;20")
        self.config["live_verified"] = True
        store = self.store()
        boundary = self.csv.stat().st_size
        store.capture()
        self.append(b";50;1010\n")
        store.capture(live_from=boundary)
        self.assertIsNone(json.loads(self.events(store)[0]["payload"])["captured_at"])

    def test_header_is_explicit_and_mismatch_rolls_back(self):
        self.config["header"] = ["s", "t", "h", "p"]
        store = self.store()
        with self.assertRaises(Halt):
            store.capture()
        self.assertEqual(store.meta()["offset"], 0)
        self.assertEqual(self.events(store), [])
        self.csv.write_bytes(b"s;t;h;p\n1;20;50;1010\n")
        store.capture()
        self.assertEqual(store.counts(), {"header": 1, "pending": 1})

    def test_malformed_rows_quarantined_without_blocking_valid_rows(self):
        self.append(b"not,a,measurement\n2;21;50;1010\n")
        store = self.store()
        store.capture()
        self.assertEqual(store.counts(), {"pending": 2, "quarantine": 1})
        self.assertEqual(self.events(store)[1]["raw"], b"not,a,measurement\n")

    def test_database_failure_rolls_back_cursor_and_events(self):
        store = self.store()
        store.db.executescript("CREATE TRIGGER synthetic_disk_failure BEFORE UPDATE ON metadata "
                              "BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;")
        with self.assertRaises(sqlite3.Error):
            store.capture()
        self.assertEqual(store.meta()["offset"], 0)
        self.assertEqual(self.events(store), [])
        store.db.execute("DROP TRIGGER synthetic_disk_failure")
        self.assertEqual(store.capture(), 1)

    def test_rotation_truncation_and_rewrite_halt_without_reimport(self):
        store = self.store()
        store.capture()
        original = self.csv.read_bytes()
        self.csv.write_bytes(b"0;20;50;1010\r\n")
        with self.assertRaises(Halt):
            store.capture()
        self.csv.write_bytes(b"")
        with self.assertRaises(Halt):
            store.capture()
        replacement = self.root / "replacement.csv"
        replacement.write_bytes(original)
        os.replace(replacement, self.csv)
        with self.assertRaises(Halt):
            store.capture()
        self.assertEqual(len(self.events(store)), 1)

    def test_missing_corrupt_or_changed_state_is_not_reinitialized(self):
        with self.assertRaises(Halt):
            self.store(initialize=False)
        store = self.store()
        with self.assertRaises(Halt):
            self.store()
        self.config["delimiter"] = "|"
        with self.assertRaises(Halt):
            self.store(initialize=False)
        store.db.close()
        store.path.write_bytes(b"synthetic corruption")
        with self.assertRaises(sqlite3.Error):
            self.store(initialize=False)
        store.path.unlink()
        with self.assertRaises(Halt):
            self.store()  # marcatore presente, DB perso

    def test_large_line_stops_before_cursor_changes(self):
        self.csv.write_bytes(b"x" * 65537 + b"\n")
        store = self.store()
        with self.assertRaises(Halt):
            store.capture()
        self.assertEqual(store.meta()["offset"], 0)

    def test_single_instance_lock_and_release(self):
        with InstanceLock(self.config["state_dir"]):
            with self.assertRaises(Halt):
                with InstanceLock(self.config["state_dir"]):
                    self.fail("Seconda istanza ammessa")
        with InstanceLock(self.config["state_dir"]):
            pass

    def test_lost_response_after_commit_retries_frozen_payload_then_duplicate(self):
        store = self.store()
        store.capture()
        sent = []

        def lost(endpoint, token, raw):
            sent.append(raw)
            raise TimeoutError("synthetic loss after server commit")

        deliver(store, "synthetic-token", 10, send=lost)
        restarted = self.store(initialize=False)

        def duplicate(endpoint, token, raw):
            sent.append(raw)
            return self.receipt(endpoint, token, raw, status=200)

        deliver(restarted, "synthetic-token", 100, send=duplicate)
        self.assertEqual(sent[0], sent[1])
        self.assertEqual(restarted.counts(), {"confirmed": 1})
        restarted.replay_confirmed()
        self.assertEqual(self.events(restarted)[0]["payload"], sent[0])

    def test_crash_after_response_before_local_confirmation_reuses_identity(self):
        store = self.store()
        store.capture()
        old = self.events(store)[0]["payload"]
        store.db.executescript("CREATE TRIGGER synthetic_crash BEFORE UPDATE ON events "
                              "BEGIN SELECT RAISE(ABORT,'synthetic crash'); END;")
        with self.assertRaises(sqlite3.Error):
            deliver(store, "synthetic-token", 10, send=self.receipt)
        store.db.execute("DROP TRIGGER synthetic_crash")
        restarted = self.store(initialize=False)
        self.assertEqual(self.events(restarted)[0]["payload"], old)
        deliver(restarted, "synthetic-token", 20, send=self.receipt)
        self.assertEqual(restarted.counts(), {"confirmed": 1})

    def test_auth_suspends_persistently_and_requires_resume(self):
        store = self.store()
        store.capture()
        for status in (401, 403, 302, 404):
            with self.subTest(status=status):
                store.resume()
                deliver(store, "synthetic-token", 10, send=lambda *args: (status, {}, b""))
                self.assertIsNotNone(store.meta()["suspended"])
                self.assertEqual(store.counts(), {"pending": 1})
                restarted = self.store(initialize=False)
                self.assertEqual(deliver(restarted, "synthetic-token", 20, send=self.receipt), 0)

    def test_permanent_error_does_not_block_later_rows(self):
        self.append(b"2;21;50;1010\n")
        store = self.store()
        store.capture()
        first_id = self.events(store)[0]["id"]

        def send(endpoint, token, raw):
            return (409, {}, b"") if json.loads(raw)["ingestion_id"] == first_id else self.receipt(endpoint, token, raw)

        deliver(store, "synthetic-token", 10, send=send)
        self.assertEqual(store.counts(), {"confirmed": 1, "quarantine": 1})

    def test_invalid_or_mismatched_confirmation_stays_pending(self):
        store = self.store()
        store.capture()
        for body in (b"{}", b"not JSON", b"[]", b"null", b"x" * 65537):
            with self.subTest(body=body[:20]):
                deliver(store, "synthetic-token", 1000, send=lambda *args: (201, {}, body))
                self.assertEqual(store.counts(), {"pending": 1})
                store.db.execute("UPDATE events SET next_attempt=0")
                store.db.commit()
        status, headers, body = self.receipt(None, None, self.events(store)[0]["payload"])
        receipt = json.loads(body)
        receipt["ingestion_id"] = str(uuid.uuid4())
        deliver(store, "synthetic-token", 1000, send=lambda *args: (status, headers, json.dumps(receipt).encode()))
        self.assertEqual(store.counts(), {"pending": 1})

    def test_retry_after_delta_and_date_and_backoff(self):
        self.assertEqual(retry_delay(0, {"Retry-After": "120"}, 100, jitter=lambda: 0), 220)
        self.assertEqual(retry_delay(0, {"retry-after": "Thu, 01 Jan 1970 00:05:00 GMT"}, 100), 300)
        self.assertGreaterEqual(retry_delay(10000, {}, 100), 228)
        store = self.store()
        store.capture()
        for status in (408, 429, 500, 503):
            with self.subTest(status=status):
                with store.db:
                    store.db.execute("UPDATE events SET next_attempt=0")
                deliver(store, "synthetic-token", 100, send=lambda *args: (status, {"Retry-After": "60"}, b""))
                self.assertEqual(store.counts(), {"pending": 1})
                self.assertEqual(deliver(store, "synthetic-token", 110, send=self.receipt), 0)

    def test_transport_bearer_timeout_and_redirect_refusal(self):
        self.assertIsNone(NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.invalid"))

        class Response:
            code = 201
            headers = {}

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self, limit):
                return b"{}"

        with patch("uploader.core.request.build_opener") as build:
            build.return_value.open.return_value = Response()
            https_send(self.config["endpoint"], "synthetic-token", "{}")
            args, kwargs = build.return_value.open.call_args
            self.assertEqual(kwargs["timeout"], 15)
            self.assertEqual(args[0].get_header("Authorization"), "Bearer synthetic-token")
            self.assertEqual(args[0].get_method(), "POST")


if __name__ == "__main__":
    unittest.main()
