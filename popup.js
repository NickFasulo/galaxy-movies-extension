const SITE = 'https://galaxymovies.app'
const MAX_ITEMS = 8

let data = null
let myProviders = []
let active = 'added'

const titleUrl = (t) => (t.tmdbId ? `${SITE}/${t.tmdbType === 'tv' ? 'tv' : 'movies'}/${t.tmdbId}` : `${SITE}/leaving`)

function rows(tab) {
  const rows = []
  for (const [key, p] of Object.entries(data?.providers || {})) {
    const label = p.label || key
    if (myProviders.length && !myProviders.map((x) => x.toLowerCase()).includes(label.toLowerCase())) continue
    for (const t of p[tab] || []) rows.push({ ...t, label })
  }
  rows.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  return rows.slice(0, MAX_ITEMS)
}

function render() {
  const list = document.getElementById('list')
  const empty = document.getElementById('empty')
  const items = rows(active)
  list.innerHTML = ''
  empty.hidden = items.length > 0
  for (const t of items) {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = titleUrl(t)
    a.target = '_blank'
    a.rel = 'noopener'
    a.textContent = t.title + (t.year ? ` (${t.year})` : '')
    const meta = document.createElement('span')
    meta.className = 'meta'
    meta.textContent = [t.label, t.date, t.season ? `season ${t.season}` : ''].filter(Boolean).join(' · ')
    a.appendChild(meta)
    li.appendChild(a)
    list.appendChild(li)
  }
  const first = Object.keys(data?.providers || {})[0]
  document.getElementById('full').href = `${SITE}/leaving${first ? `/${first}` : ''}`
}

document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]')
  if (!btn) return
  active = btn.dataset.tab
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('active', b === btn)
  render()
})

async function main() {
  const opts = await chrome.storage.sync.get({ myProviders: [] })
  myProviders = opts.myProviders || []
  data = await chrome.runtime.sendMessage({ type: 'changes' })
  if (data?.error) {
    document.getElementById('empty').hidden = false
    document.getElementById('empty').textContent = 'Could not load changes — try again shortly.'
    return
  }
  render()
}

main()
