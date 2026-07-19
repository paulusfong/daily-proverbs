# Deploy Daily Proverbs

## Current production

| Host | URL | Security headers |
|------|-----|------------------|
| **GitHub Pages** | https://paulusfong.github.io/daily-proverbs/ | Meta CSP only (Pages does not apply `_headers` / `vercel.json`) |
| **Vercel** (recommended for headers) | Deploy with steps below | Full headers from `vercel.json` |

GitHub Pages is already publishing from `main` (HTTPS enforced).

## Live QA

```bash
./scripts/qa-live.sh
# or against another host:
./scripts/qa-live.sh https://your-deployment.example
```

## Deploy to Vercel (HTTP security headers)

Requires a one-time login (interactive):

```bash
npx vercel login
npx vercel link          # link this repo root
npx vercel --prod        # production deploy
```

Or with a token (CI / non-interactive):

```bash
export VERCEL_TOKEN=...   # from https://vercel.com/account/tokens
npx vercel --prod --token "$VERCEL_TOKEN" --yes
```

After deploy, confirm headers:

```bash
curl -sI https://YOUR-PROJECT.vercel.app/ | grep -iE 'content-security|x-frame|x-content|referrer|permissions'
./scripts/qa-live.sh https://YOUR-PROJECT.vercel.app
```

## Deploy to Netlify / Cloudflare Pages

- **Netlify / Cloudflare Pages:** repo root, no build command; uses `_headers`
- **Output directory:** `.` (site root)

## After every release

1. Push to `main` (or deploy with Vercel/Netlify)
2. Bump `CACHE_NAME` in `service-worker.js` when assets change
3. Run `./scripts/qa-live.sh` against production
4. Hard-refresh once on a device so the new service worker activates
