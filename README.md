# image-background-remover

MVP: Next.js + Tailwind (Cloudflare Pages) + Cloudflare Worker + remove.bg.

## Repo structure
- `web/` Next.js (Pages)
- `worker/` Cloudflare Worker (API)
- `docs/` product docs

## Local dev
```bash
cd web
npm i
npm run dev
```

## Deploy (Cloudflare)
### Worker
```bash
cd worker
npm i -g wrangler
wrangler deploy
wrangler secret put REMOVEBG_API_KEY
```

### Pages
Deploy `web/` as the Pages project root.
Route `/api/remove-bg` to the Worker (same domain recommended).
