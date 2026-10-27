import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dateInput, measurementTime } from '../src/admin-time.ts'

process.env.TZ = 'Europe/Rome'

test('modifica amministrativa: orario invariato conserva secondi, millisecondi e secondo passaggio dell’ora solare', () => {
  const original = '2026-10-25T01:30:45.123456+00:00'
  assert.equal(dateInput(original), '2026-10-25T02:30:45.123')
  assert.equal(measurementTime(dateInput(original), original), '2026-10-25T01:30:45.123Z')
  assert.equal(measurementTime('', null), null)
})

test('modifica amministrativa: nuovo orario locale e rimozione esplicita della data', () => {
  assert.equal(measurementTime('2026-10-27T14:12:45.123', null), '2026-10-27T13:12:45.123Z')
  assert.equal(measurementTime('2026-10-27T14:12', null), '2026-10-27T13:12:00.000Z')
  assert.equal(measurementTime('', '2026-10-27T12:00:00Z'), null)
})

test('modifica amministrativa: ore inesistenti nel cambio legale e date non valide sono rifiutate', () => {
  for (const value of ['2026-03-29T02:30', '2026-02-30T12:00', 'non-data']) {
    assert.throws(() => measurementTime(value, null), /non valide o inesistenti/)
  }
})
