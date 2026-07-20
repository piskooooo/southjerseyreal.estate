# South Jersey Real Estate

React/Vite source for `southjerseyreal.estate`.

Project status and unfinished work are tracked in [`docs/project-todo.md`](docs/project-todo.md). Reusable project descriptions, the complete status-labeled feature inventory, and marketing claim guidance are in [`docs/marketing-project-description.md`](docs/marketing-project-description.md). The compliance implementation and remaining human approvals are recorded in [`docs/compliance-review-checklist.md`](docs/compliance-review-checklist.md), with a concise handoff in [`docs/compliance-review-packet.md`](docs/compliance-review-packet.md). The current visual system is documented in [`docs/color-palette.md`](docs/color-palette.md), and the paused dark-theme options are in [`docs/dark-theme-palette-review.md`](docs/dark-theme-palette-review.md). Cloud deployment and recovery procedures are in [`docs/cloudflare-pages-supabase-brevo.md`](docs/cloudflare-pages-supabase-brevo.md).

## Project Layout

- `src/content/generatedSiteData.ts` contains compliance-reduced county/community fallback structure and image paths.
- `src/content/complianceData.json` is the single source for verified brokerage, office, and salesperson facts.
- `src/content/siteEditor.ts` maps those fallbacks into the draft/published website-content model.
- `docs/community-profile-drafts.md` contains unpublished, sourced county/community copy awaiting owner review.
- `src/admin` contains the private, single-administrator website editor and contact inbox served at `/admin`.
- `src/content/navigation.ts` controls header dropdowns, footer links, and social links.
- `src/components/Layouts.tsx` contains reusable page renderers and the public forms.
- `src/cloudForms.ts` calls the public form endpoints without exposing backend credentials.
- `src/reviews.ts` loads the public Google review feed used only on the About page.
- `supabase/functions` contains the protected public form/review handlers and authenticated Pages-rebuild handler.
- `supabase/migrations` contains form storage, rate limiting, retention, notification scheduling, and the private editor schema.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run import:live
npm test
npm run test:compliance
npm run test:db
```

`npm test` runs the frontend and Edge Function unit/component suite. `npm run test:compliance`
builds the production site and runs the full hydrated-route, metadata, keyboard, screenshot,
and automated accessibility suite in Chrome. `npm run test:db`
runs the transactional Supabase regression suite against the local Supabase stack and
therefore requires Docker and `supabase start`.

Create an ignored `.env.local` from `.env.example` for local Vite builds. The browser-visible settings are the GA4 measurement ID, Supabase project URL, Supabase publishable key, and Turnstile site key; none is a service-role credential.

## Production Hosting

- Cloudflare Pages project: `southjerseyreal-estate`
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`
- Default build image: v3 with Node 22
- Public site hostnames: `southjerseyreal.estate`, `www.southjerseyreal.estate`, and `southjerseyreal-estate.pages.dev`
- Form backend: Supabase project `sinbxruqlaywvbzcvfli`
- Contact delivery and newsletter double opt-in: Brevo
- Bot protection: Cloudflare Turnstile
- Private content management: Supabase Auth/database/storage at `/admin`

Pushing `main` triggers a Cloudflare Pages deployment. Supabase migrations and Edge Functions are deployed separately with the Supabase CLI as described in the deployment guide. Recovery uses a prior known-good Git revision and Cloudflare Pages deployment; the retired Unraid/GHCR application stack is no longer part of this repository.

## Analytics

The site uses consent-gated GA4 measurement ID `G-97H86MNHP8`. It sends SPA `page_view` events, contact/navigation/link events, `generate_lead` plus `contact_lead` after a successful contact inquiry, and `sign_up` after a successful newsletter subscription. Only the direct `contact_lead` event is configured as the editable lead key event.
