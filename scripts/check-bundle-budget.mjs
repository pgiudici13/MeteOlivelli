import { readFile } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

export const BUDGET = { javascript: 110 * 1024, css: 10 * 1024 }

export function evaluateBudget(sizes, limits = BUDGET) {
  return Object.fromEntries(Object.keys(limits).map(type => [type, { bytes: sizes[type], limit: limits[type], passed: sizes[type] <= limits[type] }]))
}

export async function measureInitialAssets(dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')) {
  const html = await readFile(join(dist, 'index.html'), 'utf8')
  const assets = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="(\/assets\/[^\"]+)"/g)]
    .map(match => match[1]).filter((asset, index, all) => all.indexOf(asset) === index)
  const sizes = { javascript: 0, css: 0 }
  for (const asset of assets) {
    const type = asset.endsWith('.js') ? 'javascript' : asset.endsWith('.css') ? 'css' : null
    if (type) sizes[type] += gzipSync(await readFile(join(dist, asset.slice(1)))).length
  }
  if (!sizes.javascript || !sizes.css) throw new Error('Asset iniziali non individuati nella build')
  return sizes
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const outcome = evaluateBudget(await measureInitialAssets())
    for (const [type, result] of Object.entries(outcome)) {
      console.log(`${type}: ${(result.bytes / 1024).toFixed(1)} KiB gzip / ${(result.limit / 1024).toFixed(0)} KiB budget ${result.passed ? 'OK' : 'SUPERATO'}`)
    }
    if (Object.values(outcome).some(result => !result.passed)) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Controllo bundle non riuscito')
    process.exitCode = 1
  }
}
