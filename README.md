# South Jersey Real Estate

React/Vite source for `southjerseyreal.estate`.

Project status and unfinished work are tracked in [`docs/project-todo.md`](docs/project-todo.md). Cloud deployment and recovery procedures are in [`docs/cloudflare-pages-supabase-brevo.md`](docs/cloudflare-pages-supabase-brevo.md).

## Project Layout

- `src/content/generatedSiteData.ts` contains editable page sections, county/town copy, image paths, and legal/FAQ content.
- `src/content/navigation.ts` controls header dropdowns, footer links, and social links.
- `src/components/Layouts.tsx` contains reusable page renderers and the public forms.
- `src/cloudForms.ts` calls the public form endpoints without exposing backend credentials.
- `supabase/functions` contains the Turnstile-protected contact and newsletter handlers.
- `supabase/migrations` contains the private form storage, rate limiting, retention, and notification schedule.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run import:live
npm test
npm run test:db
```

`npm test` runs the frontend and Edge Function unit/component suite. `npm run test:db`
runs the transactional Supabase regression suite against the local Supabase stack and
therefore requires Docker and `supabase start`.

Create an ignored `.env.local` from `.env.example` for local Vite builds. The only browser-visible settings are the GA4 measurement ID, Supabase project URL, and Turnstile site key.

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

Pushing `main` triggers a Cloudflare Pages deployment. Supabase migrations and Edge Functions are deployed separately with the Supabase CLI as described in the deployment guide.

## Legacy Rollback

The Docker, Caddy, `lead-api`, GHCR workflow, and Unraid guide remain in the repository as a temporary rollback path. They are no longer the intended production architecture. The Docker frontend uses the same Supabase and Turnstile endpoints as Pages.

## Analytics

The site uses consent-gated GA4 measurement ID `G-97H86MNHP8`. It sends SPA `page_view` events, contact/navigation/link events, and `generate_lead` after a successful form response. `generate_lead` is configured as a GA4 key event.
