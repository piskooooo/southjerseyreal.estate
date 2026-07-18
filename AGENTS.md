# Agent Guidance

Guidance for future Codex work on the South Jersey Real Estate site.

## Canonical Project Root

- Work from `/Users/pisko/Documents/southjerseyreal.estate`.
- At the start of new project threads, confirm `pwd` is this folder and run `git status --short --branch`.
- This repo is already in a top-level project folder; do not use older generated Codex wrapper folders for active work.

## Repository Identity and Push Target

- This project is the **South Jersey Real Estate website**, not HomeBase CRM and not The Plum Real Estate Group website.
- Canonical GitHub repository: `https://github.com/piskooooo/southjerseyreal.estate`
- Expected Git remote: `origin https://github.com/piskooooo/southjerseyreal.estate.git`
- Production branch: `main`
- Normal push target: `origin/main`
- HomeBase CRM is a separate project at `/Users/pisko/Documents/homebase-crm`. Never stage, commit, or push HomeBase CRM files while working on this project.
- Before every commit or push, run `pwd`, `git status --short --branch`, and `git remote -v`. Stop if the project root, branch, or `origin` does not match the values above.
- Only push when the user asks for a push or the current request clearly includes publishing the completed changes. Push this repository with `git push origin main` unless the user explicitly requests another branch or pull-request workflow.
- After pushing, verify that local `main` is synchronized with `origin/main`, the GitHub test workflow succeeds, and the Cloudflare Pages deployment succeeds.

## Product Goal

This is a React/Vite rebuild of `southjerseyreal.estate`, originally cloned from the Squarespace site and intended to be more editable, self-hostable, and visually polished. Keep content editable as structured sections, not as page-sized blobs.

## Start Here

- Read `README.md`, then `docs/project-todo.md`, `docs/compliance-review-checklist.md`, and `docs/cloudflare-pages-supabase-brevo.md`, then the specific files you plan to touch.
- Treat `docs/project-todo.md` as the source of truth for unfinished work. Update its checkboxes and completion details when a listed task is actually finished.
- Keep the public site safe for production: do not commit real SMTP secrets, webhook URLs, private emails beyond approved public-facing addresses, lead data, or local `.env` files.
- Preserve the separation between content and layout.

## Project Structure

- `src/content/generatedSiteData.ts` contains the compliance-reduced county/community fallback structure and image paths. Do not restore the retired imported marketing narratives.
- `src/content/complianceData.json` is the single source for verified brokerage, licensed-office, and salesperson facts. Do not duplicate or invent those values.
- `src/components/Compliance.tsx` renders the required brokerage, fair-housing, community-information, provider-choice, and form-consent disclosures.
- `src/content/siteEditor.ts` maps compiled fallbacks into the structured draft/published content model.
- `src/admin` contains the private single-administrator editor and contact inbox served at `/admin`.
- `src/content/navigation.ts` controls header dropdowns, footer links, and social links.
- `src/components/Layouts.tsx` contains reusable page renderers for home, county pages, contact, and standard content pages.
- `src/components/Blocks.tsx` renders editable text blocks into headings, paragraphs, links, and buttons.
- `src/cloudForms.ts` sends public form requests to Supabase Edge Functions.
- `supabase/functions` contains the Turnstile-protected form handlers and authenticated `site-rebuild` handler.
- `supabase/migrations` contains private form storage, rate limiting, retention, notification scheduling, and the editor schema.
- `.codex/skills/turnstile-spin` contains the reusable, project-local Turnstile setup and validation workflow.
- `docs/cloudflare-pages-supabase-brevo.md` covers production deployment, testing, editor provisioning, and recovery.

## Commands

```bash
npm install
npm run dev
npm run build
npm run import:live
npm test
npm run test:compliance
npm run test:db
npx supabase db push
npx supabase functions deploy contact-submit --no-verify-jwt
npx supabase functions deploy newsletter-subscribe --no-verify-jwt
npx supabase functions deploy site-rebuild --no-verify-jwt
```

## Deployment Expectations

- Primary frontend: Cloudflare Pages project `southjerseyreal-estate`, deployed from `origin/main` with Node 22.
- Primary backend: Supabase project ref `sinbxruqlaywvbzcvfli`; `contact-submit` and `newsletter-subscribe` are intentionally public endpoints and enforce origin checks plus server-side Turnstile validation. `site-rebuild` is an authenticated endpoint that verifies the bearer user and the private administrator slot itself.
- Contact notifications and newsletter double opt-in use the personal Brevo workspace. Never commit the Brevo key or Turnstile secret.
- Pages build variables are `VITE_GA_MEASUREMENT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_TURNSTILE_SITE_KEY`; all four are browser-visible by design.
- Cloudflare Pages is the only supported production frontend. Docker is still useful for the local Supabase test stack, but the former Unraid/GHCR deployment path is retired.
- Keep `VITE_GA_MEASUREMENT_ID=G-97H86MNHP8` unless the user gives a new GA4 measurement ID.

## Conventions

- Use `rg`/`rg --files` for search and `apply_patch` for manual edits.
- Keep changes scoped and consistent with the current React/Vite structure.
- Prefer real content and actual site assets over placeholder marketing copy.
- When changing public pages, metadata, forms, or shared layout, run `npm run test:compliance`; for a narrow non-public change, at minimum run `npm run build` and the relevant unit tests.
- Keep unverified REALTOR membership marks and unverified settlement-service provider entries out of public content. Record current human approval and verification status in `docs/compliance-review-checklist.md`.
- When changing public forms or Edge Functions, validate Turnstile, test a clearly labeled submission against the preview environment, confirm delivery without printing personal data, and remove the test record afterward.
- Keep `.env`, `.env.local`, lead submissions, SMTP passwords, webhook secrets, and generated private data out of git.
