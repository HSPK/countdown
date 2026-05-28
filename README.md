# CountDown

> Editorial countdown + todo · 5 themes · 100% serverless · PWA

▶︎ Live: <https://hspk.github.io/countdown/>

## Features

- **Home / All / Settings** — three-tab editorial list
- **5 built-in themes** — Mono Light / Mono Dark / Paper / Cyberpunk / Flip Clock; custom themes load from JSON
- **i18n** — English (default) and 中文; switch in Settings
- **9-chapter manual** — built-in docs with coordinate-style pagination
- **Broadcast (OBS)** — `?broadcast=<id>&bg=chroma|transparent|...` embed URL for live overlays
- **Wheel date picker** with lunar calendar (农历) display
- **Recurring tasks** — daily / weekly / monthly / custom cron, each occurrence rendered as its own row
- **Subscription sources** — remote JSON sources (read-only) alongside local todos; import / export JSON
- **Desktop notifications** — three-stage alerts: 1h / 10m / due
- **PWA** — installable to desktop & homescreen, offline-capable
- **Serverless** — purely client-side, drop on any static host
- **Mobile-tuned** — safe-area-inset for notch / home indicator, wheel input that snaps one cell per tick, infinite scroll on the All tab

## Development

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build & Deploy

```bash
npm run build        # output: dist/
npm run preview      # preview dist/ locally
```

`dist/` is a fully static bundle and can be deployed to:

- **GitHub Pages** (this repo auto-deploys to `https://hspk.github.io/countdown/` via `.github/workflows/deploy.yml`)
- Vercel / Netlify / Cloudflare Pages (build = `npm run build`, output = `dist`)
- Any nginx / S3 / OSS-style static host

> For sub-path deploys set the `VITE_BASE` env variable (e.g. `/countdown/`). The workflow already injects it from the repo name.

## Stack

- Vite + React 18 + TypeScript
- Zustand (state + persist middleware)
- marked + DOMPurify (Markdown rendering)
- vite-plugin-pwa (Workbox SW + manifest)
- 100% client-side · zero backend dependency
