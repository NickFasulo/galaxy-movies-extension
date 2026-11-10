// Where-to-watch chip on IMDb/TMDB/Letterboxd title pages. Renders into a
// Shadow DOM so site CSS can't restyle it; fixed position avoids depending
// on each site's (volatile) DOM structure. Collapsed = one-line pill;
// expanded = card with every provider category + diff events.

(function () {
  const SITE_KEY = location.hostname.includes('imdb.com')
    ? 'imdb'
    : location.hostname.includes('themoviedb.org')
      ? 'tmdb'
      : location.hostname.includes('letterboxd.com')
        ? 'letterboxd'
        : null
  if (!SITE_KEY) return

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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

  let chipHost = null
  let dismissed = false

  function render(result, myProviders, open) {
    chipHost?.remove()
    document.getElementById('gm-chip-host')?.remove()
    chipHost = document.createElement('div')
    chipHost.id = 'gm-chip-host'
    const shadow = chipHost.attachShadow({ mode: 'open' })

    const p = result.providers || {}
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
    const mine = new Set(myProviders.map(norm))
    const mark = (s) => {
      const base = mine.has(norm(s.name)) || [...mine].some((m) => norm(s.name).includes(m) || m.includes(norm(s.name))) ? `★${s.name}` : s.name
      return s.leavingOn ? `${base} (leaves ${s.leavingOn.slice(5)})` : base
    }
    const names = (list, max = 6) => {
      const items = (list || []).map(mark)
      const shown = items.slice(0, max)
      return shown.join(', ') + (items.length > max ? ` +${items.length - max} more` : '')
    }

    const subs = p.flatrate || []
    const free = (p.free || []).concat(p.ads || [])
    const rentBuy = (p.rent || []).concat(p.buy || [])
    const hasData = subs.length || free.length || rentBuy.length
    const coming = (result.events?.coming || []).slice(0, 3)

    // Collapsed line: top subs + free; when nothing's streaming, the
    // announced arrival IS the answer.
    const line = hasData
      ? [
          subs.length ? `▶ ${names(subs, 3)}` : '',
          free.length ? `free: ${names(free, 2)}` : '',
          !subs.length && coming.length ? `→ ${coming.map((c) => `${c.provider} ${c.date || ''}`).join(', ')}` : ''
        ]
          .filter(Boolean)
          .join(' · ')
      : coming.length
        ? `→ ${coming.map((c) => `${c.provider} ${c.date || ''}`).join(', ')}`
        : 'Where to watch'

    const section = (label, list) =>
      (list || []).length
        ? `<div class="sec"><span class="lab">${label}</span><span class="names">${esc(names(list))}</span></div>`
        : ''

    const card = `
      <div class="title">${esc(result.title)}${result.year ? ` (${result.year})` : ''}</div>
      ${hasData ? section('Stream', subs) + section('Free', free) + section('Rent/buy', rentBuy) : '<div class="sec names">Not streaming in this region.</div>'}
      ${coming.length ? `<div class="coming">Coming to ${esc(coming.map((c) => `${c.provider}${c.date ? ` ${c.date.slice(5)}` : ''}`).join(', '))}</div>` : ''}
      <div class="foot"><a href="${result.url}" target="_blank" rel="noopener noreferrer">galaxymovies.app →</a></div>`

    shadow.innerHTML = `
      <style>
        .wrap {
          position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
          background: #14181c; color: rgba(255,255,255,.9);
          border: 1px solid rgba(255,255,255,.14); border-radius: 14px;
          box-shadow: 0 6px 24px rgba(0,0,0,.5); overflow: hidden;
          font: 500 13px/1.45 -apple-system, system-ui, sans-serif;
          max-width: min(320px, calc(100vw - 32px));
          animation: gm-in .25s ease-out;
        }
        @keyframes gm-in { from { opacity: 0; transform: translateY(6px) } }
        .bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
        .logo { font-weight: 800; color: #ffd63d; letter-spacing: .02em }
        .line { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .card { display: none; padding: 0 14px 12px; }
        .wrap.open .card { display: block; }
        .wrap.open .line { display: none; }
        .title { font-weight: 700; margin: 2px 0 8px; }
        .sec { display: flex; gap: 8px; margin: 4px 0; align-items: baseline; }
        .lab { flex: 0 0 56px; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.4); }
        .names { font-size: 12.5px; }
        .coming { margin-top: 8px; font-size: 12px; color: #ffd63d; }
        .foot { margin-top: 8px; }
        a { color: #8ab4f8; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
        button {
          background: none; border: 0; color: rgba(255,255,255,.4);
          cursor: pointer; font-size: 14px; padding: 2px 2px; line-height: 1;
        }
        button:hover { color: rgba(255,255,255,.8) }
      </style>
      <div class="wrap${open ? ' open' : ''}" role="complementary" aria-label="Where to watch">
        <div class="bar">
          <span class="logo">GM</span>
          <span class="line">${esc(line)}</span>
          <button class="exp" title="${open ? 'Collapse' : 'Show all services'}" aria-expanded="${open}">${open ? '⌄' : '⌃'}</button>
          <a href="${result.url}" target="_blank" rel="noopener noreferrer">→</a>
          <button class="close" title="Hide">✕</button>
        </div>
        <div class="card">${card}</div>
      </div>`

    const wrap = shadow.querySelector('.wrap')
    const exp = shadow.querySelector('.exp')
    exp.addEventListener('click', () => {
      const isOpen = wrap.classList.toggle('open')
      exp.textContent = isOpen ? '⌄' : '⌃'
      exp.title = isOpen ? 'Collapse' : 'Show all services'
      exp.setAttribute('aria-expanded', String(isOpen))
      chrome.storage.sync.set({ chipOpen: isOpen })
    })
    shadow.querySelector('.close').addEventListener('click', () => {
      dismissed = true
      chipHost?.remove()
    })
    document.documentElement.appendChild(chipHost)
  }

  async function main() {
    const opts = await chrome.storage.sync.get({ region: 'US', sites: {}, myProviders: [], chipOpen: false })
    if (opts.sites[SITE_KEY] === false) return
    const query = extractQuery()
    if (!query) return
    query.region = opts.region
    const result = await chrome.runtime.sendMessage({ type: 'where', params: query })
    if (result?.error || !result || dismissed) return
    render(result, opts.myProviders || [], !!opts.chipOpen)
  }

  main()
  // SPA navigations (TMDB/Letterboxd) reuse the document — rerun on URL change.
  // Some pages strip foreign nodes during re-renders; re-append unless dismissed.
  let last = location.href
  new MutationObserver(() => {
    if (location.href !== last) {
      last = location.href
      dismissed = false
      chipHost?.remove()
      chipHost = null
      main()
      return
    }
    if (chipHost && !chipHost.isConnected && !dismissed) {
      document.documentElement.appendChild(chipHost)
    }
  }).observe(document, { subtree: true, childList: true })
})()
