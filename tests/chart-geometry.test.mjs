import test from 'node:test'
import assert from 'node:assert/strict'
import { smoothPath } from '../src/chart-geometry.ts'

test('smoothPath passes through samples and keeps each monotone run inside its values', () => {
  const points = [{ x: 0, y: 8 }, { x: 20, y: 2 }, { x: 70, y: 4 }, { x: 100, y: 1 }]
  const path = smoothPath(points)
  assert.match(path, /^M0,8 C/)
  assert.match(path, /70,4 C/)
  assert.match(path, /100,1$/)

  const coordinates = path.match(/-?\d+(?:\.\d+)?/g).map(Number)
  let start = { x: coordinates[0], y: coordinates[1] }
  for (let index = 2; index < coordinates.length; index += 6) {
    const control1 = { x: coordinates[index], y: coordinates[index + 1] }
    const control2 = { x: coordinates[index + 2], y: coordinates[index + 3] }
    const end = { x: coordinates[index + 4], y: coordinates[index + 5] }
    const low = Math.min(start.y, end.y)
    const high = Math.max(start.y, end.y)
    for (let step = 1; step < 20; step++) {
      const t = step / 20
      const inverse = 1 - t
      const y = inverse ** 3 * start.y + 3 * inverse ** 2 * t * control1.y + 3 * inverse * t ** 2 * control2.y + t ** 3 * end.y
      assert.ok(y >= low - 1e-9 && y <= high + 1e-9, `curve overshot at ${y} between ${low} and ${high}`)
    }
    start = end
  }
})

test('smoothPath handles isolated and non-increasing timestamps safely', () => {
  assert.equal(smoothPath([{ x: 1, y: 2 }]), '')
  assert.equal(smoothPath([{ x: 1, y: 2 }, { x: 1, y: 3 }]), 'M1,2 L1,3')
})
