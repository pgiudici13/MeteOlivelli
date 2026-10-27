import assert from 'node:assert/strict'
import test from 'node:test'
import { measurementAge } from '../src/measurement-age.ts'

const row = { measured_at: null, captured_at: '2026-10-27T10:00:00Z', received_at: '2026-10-27T10:05:00Z' }

test('età rispetto al server, senza presentare l’acquisizione come misura fisica', () => {
  assert.match(measurementAge(row, '2026-10-27T11:20:00Z'), /Riga acquisita dal PC 1 ora e 20 minuti fa/)
  assert.match(measurementAge(row, '2026-10-27T11:20:00Z'), /non è attestato/)
})

test('preferisce l’orario della misura fisica, se attestato', () => {
  assert.equal(measurementAge({ ...row, measured_at: '2026-10-27T09:00:00Z' }, '2026-10-27T11:00:00Z'), 'Misura fisica effettuata 2 ore fa.')
})

test('ricezione recente non nasconde assenza della data fisica o problemi di orologio', () => {
  assert.match(measurementAge({ ...row, captured_at: null }, '2026-10-27T10:06:00Z'), /Riga ricevuta dal server 1 minuto fa/)
  assert.match(measurementAge(row, '2026-10-27T09:00:00Z'), /non coerente/)
  assert.equal(measurementAge(null, '2026-10-27T11:00:00Z'), null)
})
