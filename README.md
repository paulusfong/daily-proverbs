# Daily Proverbs

A lightweight Progressive Web App that shows a daily verse from the Book of Proverbs, with browse and favorites, offline support, and four languages.

**Live site (GitHub Pages):** [https://paulusfong.github.io/daily-proverbs/](https://paulusfong.github.io/daily-proverbs/)  
**Source:** [github.com/paulusfong/daily-proverbs](https://github.com/paulusfong/daily-proverbs)

Deploy notes (Vercel headers, QA script): see [DEPLOY.md](./DEPLOY.md).

## Features

- **Daily verse** — Chapter follows the day of the month (1–31); verse is **stable for that calendar day** (and language), not reshuffled on every refresh
- **Browse** — Explore curated verses across all 31 chapters
- **Favorites** — Save verses per language (stored in `localStorage`)
- **Languages** — English, 中文, Español, Français
- **Themes** — Light / dark
- **PWA** — Installable, works offline after first load
- **Share** — Web Share API with clipboard fallback

## Bible versions

| Language | Version in app | Notes |
|----------|----------------|--------|
| English (`en`) | **ESV** | Curated selection (~142 verses) |
| Chinese (`zh`) | **和合本** (CUV, simplified) | Same verse references as English |
| Spanish (`es`) | **Reina-Valera (RVR)** | Same verse references as English |
| French (`fr`) | **LSG** (Louis Segond family) | Same verse references as English |

Browse mode shows **selected verses**, not the full book text. A note in the UI makes that clear.

> **Licensing:** Bible translations have their own terms. ESV in particular is copyrighted—use and distribution must comply with the publisher’s guidelines. Chinese CUV text used for expansion is from public-domain open-Bible sources; verify rights for your deployment region and any commercial use.

## Stack

- Vanilla HTML / CSS / JavaScript (no framework, no runtime npm deps for the app)
- Pure logic in `app-logic.js` (unit-tested)
- Service worker: network-first for HTML/JS, precache for offline assets
- Security: CSP (no `unsafe-inline` styles), language whitelist, host header files

## Run locally

```bash
# From the repo root (any static server works)
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Tests

```bash
# Unit tests (Node 18+) — verse/favorites logic
node --test tests/app-logic.test.js

# Smoke suite (needs the app served on :8080)
python3 -m http.server 8080 &
./run-all-tests.sh
node test-languages-simple.js

# Production / live-site smoke
./scripts/qa-live.sh
./scripts/qa-live.sh https://paulusfong.github.io/daily-proverbs
```

CI (GitHub Actions) runs syntax checks, unit tests, JSON validation, and smoke tests on push/PR to `main`.

## Project layout

```
daily-proverbs/
├── index.html              # App shell
├── styles.css              # Design tokens, themes, layout
├── app.js                  # UI, events, localStorage
├── app-logic.js            # Pure logic (daily verse, favorites)
├── translations.js         # UI strings + language metadata
├── service-worker.js       # Offline + update strategy
├── manifest.json           # PWA manifest
├── data/
│   ├── proverbs-en.json
│   ├── proverbs-zh.json
│   ├── proverbs-es.json
│   └── proverbs-fr.json
├── icons/
├── tests/app-logic.test.js
├── run-all-tests.sh
├── test-languages-simple.js
├── _headers                # Netlify / Cloudflare Pages security headers
├── vercel.json             # Vercel security headers
└── demo-materials/         # Demo scripts / screenshot helper
```

## Deploy

Any **static HTTPS** host works. Prefer one that applies custom headers so CSP and security headers are sent as HTTP headers (stronger than the HTML meta CSP alone).

| Host | Config in repo |
|------|----------------|
| **Vercel** | `vercel.json` |
| **Netlify** | `_headers` |
| **Cloudflare Pages** | `_headers` |
| **GitHub Pages** | **Already enabled** from `main` → [/daily-proverbs/](https://paulusfong.github.io/daily-proverbs/). Does **not** apply `_headers` / `vercel.json` (meta CSP still applies) |

The service worker and manifest use **scope-relative** paths so the app works both at a domain root and under a project subpath (GitHub Pages).

### Suggested flow

1. Push to `main` (Pages rebuilds automatically), **or** connect the repo to Vercel/Netlify/Cloudflare Pages for HTTP security headers
2. Publish the **repo root** (no build step)
3. Open the production URL over HTTPS
4. Install as PWA, toggle offline, switch languages once

### Service worker cache versions

`service-worker.js` uses a named cache (e.g. `daily-proverbs-v5`). **Bump the cache name** whenever you ship meaningful asset changes so clients drop old caches and pick up new HTML/JS/data after their next online visit.

## Security notes

- No backend, no secrets, no production runtime dependencies
- Language codes are whitelisted before loading `data/proverbs-*.json`
- Verses render via `textContent` / `createElement` (no HTML injection of verse text)
- CSP: `default-src 'self'`; styles are external only
- See `SECURITY-AUDIT.md` / `SECURITY-COMPLETE.md` for earlier audit notes

## Contributing

1. Keep changes small and focused
2. Run unit tests before opening a PR
3. Prefer PRs into `main` (branch protection may require them)
4. Bump the service worker `CACHE_NAME` when changing cached assets

## License

Application code is available under the MIT License (see project terms as published). **Bible text is not covered by that license**—follow each translation’s copyright rules.
