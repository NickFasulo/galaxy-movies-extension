// Where-to-watch chip on IMDb/TMDB/Letterboxd title pages. Renders into a
// Shadow DOM so site CSS can't restyle it; fixed position avoids depending
// on each site's (volatile) DOM structure.

(function () {
  const SITE_KEY = location.hostname.includes('imdb.com')
    ? 'imdb'
    : location.hostname.includes('themoviedb.org')
      ? 'tmdb'
      : location.hostname.includes('letterboxd.com')
        ? 'letterboxd'
        : null
  if (!SITE_KEY) return

  function extractQuery() {
    if (SITE_KEY === 'imdb') {
      const m = location.pathname.match(/^\/title\/(tt\d+)/)
      return m ? { imdb_id: m[1] } : null
    }
    if (SITE_KEY === 'tmdb') {
      const m = location.pathname.match(/^\/(movie|tv)\/(\d+)/)
      return m ? { id: m[2], type: m[1] } : null
    }
    // Letterboxd: /film/{slug}/ — title + year come from the JSON-LD block.
    if (!location.pathname.startsWith('/film/')) return null
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const ld = JSON.parse(s.textContent || '{}')
        const name = ld.name || ld.item?.name
        const year = String(ld.datePublished || '').slice(0, 4)
        if (name) return { title: name, year: /^\d{4}$/.test(year) ? year : undefined }
      } catch {}
    }
    const m = document.title.match(/^(.*?)\s*\((\d{4})\)/) || document.title.match(/^(.*?)\s*[-–—]/)
    return m ? { title: m[1].trim(), year: m[2] } : null
  }

  function render(result, myProviders) {
    if (document.getElementById('gm-chip-host')) return
    const host = document.createElement('div')
    host.id = 'gm-chip-host'
    const shadow = host.attachShadow({ mode: 'open' })

    const p = result.providers || {}
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
    const mine = new Set(myProviders.map(norm))
    const mark = (s) => {
      const base = mine.has(norm(s.name)) || [...mine].some((m) => norm(s.name).includes(m) || m.includes(norm(s.name))) ? `★${s.name}` : s.name
      return s.leavingOn ? `${base} (leaves ${s.leavingOn.slice(5)})` : base
    }
    const subs = (p.flatrate || []).slice(0, 3)
    const free = (p.free || []).concat(p.ads || []).slice(0, 2)
    const hasData = subs.length || free.length || (p.rent || []).length || (p.buy || []).length
    // When the title isn't streaming but is slated to arrive, that IS the
    // answer — show it ahead of rent/buy.
    const coming = (result.events?.coming || []).slice(0, 2)

    const line = hasData
      ? [
          subs.length ? `▶ ${subs.map(mark).join(', ')}` : '',
          free.length ? `free: ${free.map(mark).join(', ')}` : '',
          !subs.length && coming.length ? `→ ${coming.map((c) => `${c.provider} ${c.date || ''}`).join(', ')}` : ''
        ]
          .filter(Boolean)
          .join(' · ')
      : coming.length
        ? `→ ${coming.map((c) => `${c.provider} ${c.date || ''}`).join(', ')}`
        : 'Where to watch'

    shadow.innerHTML = `
      <style>
        .chip {
          position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
          display: flex; align-items: center; gap: 8px;
          background: #14181c; color: rgba(255,255,255,.9);
          border: 1px solid rgba(255,255,255,.14); border-radius: 999px;
          padding: 8px 14px; font: 500 13px/1.4 -apple-system, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,.45); cursor: default;
          animation: gm-in .25s ease-out;
        }
        @keyframes gm-in { from { opacity: 0; transform: translateY(6px) } }
        .logo { font-weight: 800; color: #ffd63d; letter-spacing: .02em }
        a { color: #8ab4f8; text-decoration: none; font-weight: 600 }
        a:hover { text-decoration: underline }
        button {
          background: none; border: 0; color: rgba(255,255,255,.4);
          cursor: pointer; font-size: 14px; padding: 0 0 0 4px; line-height: 1;
        }
        button:hover { color: rgba(255,255,255,.8) }
      </style>
      <div class="chip">
        <span class="logo">GM</span>
        <span>${line.replace(/</g, '&lt;')}</span>
        <a href="${result.url}" target="_blank" rel="noopener noreferrer">→</a>
        <button title="Hide">✕</button>
      </div>`
    shadow.querySelector('button').addEventListener('click', () => host.remove())
    document.documentElement.appendChild(host)
  }

  async function main() {
    const opts = await chrome.storage.sync.get({ region: 'US', sites: {}, myProviders: [] })
    if (opts.sites[SITE_KEY] === false) return
    const query = extractQuery()
    if (!query) return
    query.region = opts.region
    const result = await chrome.runtime.sendMessage({ type: 'where', params: query })
    if (result?.error || !result) return
    render(result, opts.myProviders || [])
  }

  main()
  // SPA navigations (TMDB/Letterboxd) reuse the document — rerun on URL change.
  let last = location.href
  new MutationObserver(() => {
    if (location.href === last) return
    last = location.href
    document.getElementById('gm-chip-host')?.remove()
    main()
  }).observe(document, { subtree: true, childList: true })
})()
