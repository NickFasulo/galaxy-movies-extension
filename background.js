// Message-driven API layer: all calls to galaxymovies.app run here (MV3
// background workers with host_permissions are CORS-exempt) and results are
// cached in chrome.storage.local so repeat lookups don't hit the API's
// per-IP rate bucket.

const API = 'https://galaxymovies.app'
const WHERE_TTL = 6 * 60 * 60 * 1000
const CHANGES_TTL = 30 * 60 * 1000

async function cachedGet(key, ttlMs, fetcher) {
  const stored = await chrome.storage.local.get(key)
  const entry = stored[key]
  if (entry && Date.now() - entry.t < ttlMs) return entry.v
  const v = await fetcher()
  await chrome.storage.local.set({ [key]: { t: Date.now(), v } })
  return v
}

async function fetchWhere(params) {
  const url = new URL(`${API}/api/ext/where`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }
  const resp = await fetch(url)
  const body = await resp.json().catch(() => null)
  if (!resp.ok) return { error: body?.error || `HTTP ${resp.status}`, url: body?.url }
  return body
}

async function fetchChanges() {
  const resp = await fetch(`${API}/api/streaming-changes?provider=all`)
  const body = await resp.json().catch(() => null)
  if (!resp.ok) return { error: body?.error || `HTTP ${resp.status}` }
  return body
}

const whereKey = (p) =>
  'where:' +
  [p.region || 'US', p.type || 'any', p.id ? `id${p.id}` : p.imdb_id || `${p.title}|${p.year || ''}`]
    .join('|')
    .toLowerCase()

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'where') {
    cachedGet(whereKey(msg.params || {}), WHERE_TTL, () => fetchWhere(msg.params))
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err?.message || err) }))
    return true // async sendResponse
  }
  if (msg?.type === 'changes') {
    cachedGet('changes:all', CHANGES_TTL, fetchChanges)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: String(err?.message || err) }))
    return true
  }
  return false
})
