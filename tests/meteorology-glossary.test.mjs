import assert from 'node:assert/strict'
import test from 'node:test'
import { meteorologyGlossary } from '../src/meteorology-glossary.ts'

test('glossario con definizioni complete, uniche e senza suggerire probabilità di pioggia da umidità', () => {
  assert.equal(meteorologyGlossary.length, 8)
  assert.equal(new Set(meteorologyGlossary.map(item => item.term)).size, meteorologyGlossary.length)
  assert.ok(meteorologyGlossary.every(item => item.definition.length >= 40))
  assert.match(meteorologyGlossary.find(item => item.term === 'Umidità relativa').definition, /non corrisponde alla probabilità di pioggia/i)
})
