// Mirrors embeddableProviders() in the main repo — update when the tracked
// set changes (src/features/catalog/embed.ts).
const PROVIDERS = [
  ['netflix', 'Netflix'],
  ['amazon-prime-video', 'Amazon Prime Video'],
  ['hulu', 'Hulu'],
  ['disney-plus', 'Disney+'],
  ['apple-tv', 'Apple TV+'],
  ['max', 'Max'],
  ['peacock', 'Peacock'],
  ['paramount-plus', 'Paramount+'],
  ['tubi', 'Tubi'],
  ['pluto-tv', 'Pluto TV'],
  ['roku-channel', 'Roku Channel'],
  ['starz', 'Starz'],
  ['amc-plus', 'AMC+'],
  ['mgm-plus', 'MGM+'],
  ['crunchyroll', 'Crunchyroll'],
  ['discovery-plus', 'Discovery+'],
  ['plex', 'Plex'],
  ['kanopy', 'Kanopy'],
  ['shudder', 'Shudder'],
  ['criterion', 'Criterion Channel']
]
const SITES = ['imdb', 'tmdb', 'letterboxd']

const providerGrid = document.getElementById('providers')
for (const [key, label] of PROVIDERS) {
  const el = document.createElement('label')
  el.innerHTML = `<input type="checkbox" data-provider="${key}" value="${label.replace(/"/g, '&quot;')}" /> ${label}`
  providerGrid.appendChild(el)
}

async function load() {
  const opts = await chrome.storage.sync.get({ region: 'US', myProviders: [], sites: {} })
  document.getElementById('region').value = opts.region
  const mine = new Set(opts.myProviders)
  for (const box of document.querySelectorAll('[data-provider]')) box.checked = mine.has(box.value)
  for (const box of document.querySelectorAll('[data-site]')) box.checked = opts.sites[box.dataset.site] !== false
}

document.getElementById('save').addEventListener('click', async () => {
  const myProviders = [...document.querySelectorAll('[data-provider]:checked')].map((b) => b.value)
  const sites = {}
  for (const site of SITES) sites[site] = document.querySelector(`[data-site="${site}"]`).checked
  await chrome.storage.sync.set({ region: document.getElementById('region').value, myProviders, sites })
  const saved = document.getElementById('saved')
  saved.hidden = false
  setTimeout(() => (saved.hidden = true), 1500)
})

load()
