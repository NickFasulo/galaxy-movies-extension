# Galaxy Movies — Where to Watch (browser extension)

Manifest V3 extension that shows where a movie or show is streaming — a small chip on IMDb, TMDB and Letterboxd title pages — plus a popup with this week's arrivals, departures and announced releases for your services.

Data comes from the free public [Galaxy Movies](https://galaxymovies.app) API (`/api/ext/where`, `/api/streaming-changes`). No keys, no accounts, no tracking.

## Load unpacked (dev)

- **Chrome/Edge**: `chrome://extensions` → Developer mode → Load unpacked → pick this dir.
- **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → pick `manifest.json`.

## Options

Region (US/IN), "my services" (★-marked in the chip, filters the popup), per-site chip toggles. Right-click the toolbar icon → Options.

## Package

```sh
scripts/package.sh        # dist/galaxy-movies-extension-<version>.zip
npx web-ext lint          # AMO pre-flight (optional)
```

## Publishing checklist

| Store | Cost | Link |
|---|---|---|
| Firefox Add-ons | free | addons.mozilla.org/developers — upload zip, listed for discovery |
| Edge Add-ons | free | partner.microsoft.com — same zip |
| Chrome Web Store | $5 once | chrome.google.com/webstore/devconsole — zip + 2 screenshots (1280×800), justify `storage` + host permission + content-script matches |
| GitHub Releases | free | attach the dist zip; sideload = load-unpacked instructions above |

Privacy answers for all stores: no user data collected; network calls go to `galaxymovies.app` only. Bump `version` in `manifest.json` per release — updates re-review but are typically faster.

## Layout

```
manifest.json     MV3 manifest (Firefox needs browser_specific_settings.gecko)
background.js     message-driven API layer + storage.local cache (6h where, 30m changes)
content.js        site adapters (imdb/tmdb/letterboxd) + Shadow-DOM chip
popup.*           New / Leaving / Coming tabs from /api/streaming-changes?provider=all
options.*         region, services, site toggles (storage.sync)
icons/            resized copies of the site's generated icons
```
