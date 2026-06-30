# South Jersey Real Estate Clone

This is a React/Vite clone of the live `southjerseyreal.estate` site.

Content is intentionally separated from layout:

- `src/content/generatedSiteData.ts` contains editable page sections, county/town copy, image paths, and legal/FAQ content.
- `src/content/navigation.ts` controls header dropdowns, footer links, and social links.
- `src/components/Layouts.tsx` contains reusable page renderers for home, county pages, contact, and standard content pages.
- `src/components/Blocks.tsx` renders editable text blocks into headings, paragraphs, links, and buttons.

Useful commands:

- `npm run dev` starts the local site.
- `npm run build` type-checks and builds the app.
- `npm run import:live` regenerates `src/content/generatedSiteData.ts` from `/tmp/sjre-pages-full.json` and downloads referenced images into `public/assets/live`.

Self-hosting:

- Copy `.env.example` to `.env`, configure a real lead destination, then run `docker compose --env-file .env up -d --build`.
- The Docker build uses `VITE_GA_MEASUREMENT_ID=G-97H86MNHP8`.
- See `docs/self-host-unraid-cloudflare.md` for Unraid, Cloudflare Tunnel, preview hostname, and lead testing steps.

Analytics setup:

- Set `VITE_GA_MEASUREMENT_ID` to the site's GA4 measurement ID, for example `G-XXXXXXXXXX`, in the deployment environment.
- The app sends SPA `page_view` events, contact/nav/link click events, and a `generate_lead` event when the contact form is submitted.
- In GA4, mark `generate_lead` as a key event once it appears in Admin > Events.
