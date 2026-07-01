# Agent Guidance

Guidance for future Codex work on the South Jersey Real Estate site.

## Canonical Project Root

- Work from `/Users/pisko/Documents/southjerseyreal.estate`.
- At the start of new project threads, confirm `pwd` is this folder and run `git status --short --branch`.
- This repo is already in a top-level project folder; do not use older generated Codex wrapper folders for active work.

## Product Goal

This is a React/Vite rebuild of `southjerseyreal.estate`, originally cloned from the Squarespace site and intended to be more editable, self-hostable, and visually polished. Keep content editable as structured sections, not as page-sized blobs.

## Start Here

- Read `README.md`, then `docs/self-host-unraid-cloudflare.md`, then the specific files you plan to touch.
- Keep the public site safe for production: do not commit real SMTP secrets, webhook URLs, private emails beyond approved public-facing addresses, lead data, or local `.env` files.
- Preserve the separation between content and layout.

## Project Structure

- `src/content/generatedSiteData.ts` contains editable page sections, county/town copy, image paths, and legal/FAQ content.
- `src/content/navigation.ts` controls header dropdowns, footer links, and social links.
- `src/components/Layouts.tsx` contains reusable page renderers for home, county pages, contact, and standard content pages.
- `src/components/Blocks.tsx` renders editable text blocks into headings, paragraphs, links, and buttons.
- `lead-api/server.mjs` accepts lead form submissions and delivers them through SMTP, webhook, or both.
- `docs/self-host-unraid-cloudflare.md` covers Unraid, Cloudflare Tunnel, preview hostname, and lead testing.

## Commands

```bash
npm install
npm run dev
npm run build
npm run import:live
docker compose --env-file .env up -d --build
```

## Deployment Expectations

- Main site image: `ghcr.io/piskooooo/southjerseyreal.estate:latest`
- Lead API image: `ghcr.io/piskooooo/southjerseyreal.estate-lead-api:latest`
- The stack serves the Vite build through Caddy and proxies `/api/*` to the lead API.
- Cloudflare Tunnel fronts the Unraid-hosted stack. Preview traffic should use `preview.southjerseyreal.estate` before production cutover.
- Keep `VITE_GA_MEASUREMENT_ID=G-97H86MNHP8` unless the user gives a new GA4 measurement ID.

## Conventions

- Use `rg`/`rg --files` for search and `apply_patch` for manual edits.
- Keep changes scoped and consistent with the current React/Vite structure.
- Prefer real content and actual site assets over placeholder marketing copy.
- When changing pages or shared layout, run `npm run build`.
- When changing contact form or lead API behavior, check `/api/health` and test a safe sample lead against the configured preview environment when possible.
- If pushing Docker/deployment changes, verify the GitHub Actions image publish workflow before telling the user to update Unraid.
- Keep `.env`, `.env.local`, lead submissions, SMTP passwords, webhook secrets, and generated private data out of git.
