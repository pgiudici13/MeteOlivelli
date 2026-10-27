import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterAnalyticsEvent, revokeAnalyticsConsent, setAnalyticsTrackingEnabled, subscribeAnalyticsConsent, trackAnalyticsEvent } from '../src/analytics.ts'

const key = 'meteolivelli-analytics-consent'
function environment(run) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const store = new Map(), commands = [], cookieWrites = []
  const target = Object.assign(new EventTarget(), {
    location: { hostname: 'audit.meteolivelli.test' },
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    gtag: (...args) => commands.push(args),
  })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: target })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    get cookie() { return '_ga=fixture-sintetica; _ga_AUDIT=fixture-sintetica; theme=dark' },
    set cookie(value) { cookieWrites.push(value) },
  } })
  const storage = (changedKey = key, area = target.localStorage) => target.dispatchEvent(Object.assign(new Event('storage'), { key: changedKey, storageArea: area }))
  try {
    setAnalyticsTrackingEnabled(true)
    run({ target, store, commands, cookieWrites, storage })
  } finally {
    setAnalyticsTrackingEnabled(true)
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else delete globalThis.window
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
    else delete globalThis.document
  }
}

test('statistiche: opt-out remoto blocca subito gli invii, rimozione e clear ripristinano il default', () => environment(({ target, store, commands, storage }) => {
  const choices = []
  const stop = subscribeAnalyticsConsent(value => choices.push(value))
  try {
    store.set(key, JSON.stringify({ value: 'denied' }))
    storage()
    assert.equal(filterAnalyticsEvent({ name: 'pageview' }), null)
    assert.equal(target['ga-disable-G-F2LRCD93NW'], true)
    assert.equal(commands.at(-1)[2].analytics_storage, 'denied')
    store.delete(key)
    storage()
    assert.deepEqual(filterAnalyticsEvent({ name: 'pageview' }), { name: 'pageview' })
    assert.equal(target['ga-disable-G-F2LRCD93NW'], false)
    store.set(key, JSON.stringify({ value: 'denied' }))
    storage()
    store.clear()
    storage(null)
    assert.deepEqual(choices, ['denied', null, 'denied', null])
    assert.deepEqual(filterAnalyticsEvent({ name: 'pageview' }), { name: 'pageview' })
  } finally { stop() }
}))

test('statistiche: eventi estranei e sessionStorage ignorati; cleanup rimuove il listener', () => environment(({ store, storage }) => {
  const choices = []
  const stop = subscribeAnalyticsConsent(value => choices.push(value))
  store.set(key, JSON.stringify({ value: 'denied' }))
  storage('theme')
  storage(key, {})
  assert.deepEqual(choices, [])
  stop()
  storage()
  assert.deepEqual(choices, [])
  assert.deepEqual(filterAnalyticsEvent({ name: 'pageview' }), { name: 'pageview' })
}))

test('statistiche: revoca cancella cookie Google host/domain preservando gli altri cookie', () => environment(({ store, cookieWrites }) => {
  assert.equal(revokeAnalyticsConsent(), true)
  assert.equal(JSON.parse(store.get(key)).value, 'denied')
  for (const name of ['_ga', '_ga_AUDIT']) {
    assert.ok(cookieWrites.some(value => value.startsWith(`${name}=`) && !value.includes('domain=')))
    assert.ok(cookieWrites.some(value => value.startsWith(`${name}=`) && value.includes('domain=audit.meteolivelli.test')))
  }
  assert.ok(cookieWrites.every(value => !value.startsWith('theme=')))
}))

test('statistiche: eventi applicativi rispettano opt-out e host pubblico', () => environment(({ target, commands }) => {
  target.location.hostname = 'meteolivelli.vercel.app'
  trackAnalyticsEvent('quiz_complete', { quiz_name: 'meteo_curiosita', score: 7, score_max: 10 })
  assert.deepEqual(commands.at(-1), ['event', 'quiz_complete', { quiz_name: 'meteo_curiosita', score: 7, score_max: 10 }])
  const eventCount = commands.length
  setAnalyticsTrackingEnabled(false)
  trackAnalyticsEvent('quiz_complete', { quiz_name: 'meteo_curiosita', score: 10, score_max: 10 })
  assert.equal(commands.length, eventCount + 1) // solo il comando consent=denied
  target.location.hostname = 'preview.meteolivelli.vercel.app'
  setAnalyticsTrackingEnabled(true)
  const beforePreview = commands.length
  trackAnalyticsEvent('quiz_start', { quiz_name: 'meteo_curiosita', question_count: 10 })
  assert.equal(commands.length, beforePreview)
}))
