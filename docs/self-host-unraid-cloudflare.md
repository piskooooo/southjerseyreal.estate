# Self-Hosting on Unraid Behind Cloudflare Tunnel

This stack builds the Vite site into static files, serves it through Caddy, and proxies contact form submissions to a small lead API.

## Services

- `web`: Caddy on port `8080`, serving the Vite `dist/` bundle and reverse-proxying `/api/*`.
- `lead-api`: Node API that accepts `POST /api/leads` and delivers the lead to SMTP, a webhook, or both.
- `cloudflared`: optional Compose profile if you want this stack to run the Cloudflare Tunnel connector.

## Environment

Create a private `.env` from the template:

```bash
cp .env.example .env
```

Keep this value for GA4:

```bash
VITE_GA_MEASUREMENT_ID=G-97H86MNHP8
```

`VITE_` variables are build-time values. Rebuild the `web` image after changing them.

## Lead Destination

Configure at least one real destination before cutover. The API intentionally returns `503 Lead destination is not configured` until SMTP or webhook delivery is set.

SMTP email delivery:

```bash
LEAD_TO_EMAIL=leads@southjerseyreal.estate
LEAD_FROM_EMAIL="South Jersey Real Estate <leads@southjerseyreal.estate>"
LEAD_SMTP_HOST=smtp.example.com
LEAD_SMTP_PORT=587
LEAD_SMTP_SECURE=false
LEAD_SMTP_USER=your-smtp-user
LEAD_SMTP_PASS=
```

Now that Cloudflare Email Routing is active, the public aliases can be routed to the destination mailbox from Cloudflare:

```text
arthur@southjerseyreal.estate
leads@southjerseyreal.estate
partners@southjerseyreal.estate
advertise@southjerseyreal.estate
```

Cloudflare Email Routing handles inbound forwarding only. It does not provide SMTP for outbound form notifications, so keep configuring SMTP or webhook delivery for the lead API. If SMTP is used, use a sender address your SMTP provider permits and fill `LEAD_SMTP_PASS` only in your private `.env` file on Unraid.

Webhook delivery:

```bash
LEAD_WEBHOOK_URL=
```

Fill this with your private Zapier, Make, Pipedream, Google Apps Script, Airtable, or CRM webhook URL only in `.env`.

If the webhook needs an auth header:

```bash
LEAD_WEBHOOK_HEADER_NAME=Authorization
LEAD_WEBHOOK_HEADER_VALUE=Bearer your-token
```

## Local Build and Run

Use the prebuilt GHCR images:

```bash
docker compose --env-file .env up -d
```

Or rebuild from source locally:

```bash
docker compose --env-file .env up -d --build
```

Check the containers:

```bash
docker compose ps
curl -s http://localhost:8080/api/health
```

Expected health response:

```json
{
  "ok": true,
  "destinations": {
    "smtp": true,
    "webhook": false
  }
}
```

## Preview Hostname Testing

Before touching production, route a preview hostname through Cloudflare Tunnel.

Recommended preview hostname:

```text
preview.southjerseyreal.estate
```

If `cloudflared` runs in this same Compose project, set the public hostname service URL to:

```text
http://web:8080
```

If `cloudflared` runs elsewhere on Unraid, set the public hostname service URL to:

```text
http://UNRAID_LAN_IP:8080
```

Test the origin with a preview Host header before changing Cloudflare:

```bash
curl -I -H 'Host: preview.southjerseyreal.estate' http://UNRAID_LAN_IP:8080/
curl -s -H 'Host: preview.southjerseyreal.estate' http://UNRAID_LAN_IP:8080/api/health
```

Send a test lead after SMTP or webhook is configured:

```bash
curl -sS -X POST \
  -H 'Host: preview.southjerseyreal.estate' \
  -H 'content-type: application/json' \
  http://UNRAID_LAN_IP:8080/api/leads \
  -d '{
    "firstName": "Preview",
    "lastName": "Test",
    "email": "preview@example.com",
    "phone": "856-493-7501",
    "interest": "Sell a home",
    "message": "Preview hostname test lead. Please ignore.",
    "sourceUrl": "https://preview.southjerseyreal.estate/contact",
    "pagePath": "/contact"
  }'
```

Confirm the test lead arrives at the configured destination before production cutover.

## Unraid Notes

With the Docker Compose Manager plugin, create a stack pointed at this repo and use:

```bash
compose.yml
```

Use `.env` for private values. Do not paste SMTP passwords into tracked files.

The Compose file includes Unraid Docker labels for the site icon and WebUI link. The preferred icon URL is served by the site itself:

```text
https://southjerseyreal.estate/assets/unraid-icon.png
```

If you create the containers manually through Unraid's Docker UI instead of Compose, paste that URL into the advanced `Icon URL` field.

If you use Docker Compose Manager and the icon does not appear, check the stack's UI Labels or generated override file. Compose Manager may create blank `net.unraid.docker.icon` values in `/boot/config/plugins/compose.manager/projects/<stack-name>/docker-compose.override.yml`, and those blank values override the labels from `compose.yml`. Set the UI Label icon to the URL above, or copy the labels from `compose.unraid.override.yml` into the stack override. Then recreate the containers so Docker stores the updated labels.

To verify the labels on Unraid:

```bash
docker inspect $(docker ps -q --filter "name=southjerseyreal") \
  --format '{{.Name}} {{index .Config.Labels "net.unraid.docker.icon"}}'
```

The stack pulls these prebuilt images by default:

```text
ghcr.io/piskooooo/southjerseyreal.estate:latest
ghcr.io/piskooooo/southjerseyreal.estate-lead-api:latest
```

If the GHCR packages remain private, Unraid must log in before pulling:

```bash
docker login ghcr.io -u piskooooo
```

Use a GitHub personal access token with package read access as the password. If you make the GHCR packages public, Unraid can pull them without logging in.

If using Unraid's Docker UI instead of Compose, create two containers:

- `southjerseyreal-estate-web`: image `ghcr.io/piskooooo/southjerseyreal.estate:latest`, map host `8080` to container `8080`.
- `southjerseyreal-estate-lead-api`: image `ghcr.io/piskooooo/southjerseyreal.estate-lead-api:latest`, join the same custom Docker network, and expose container port `3000` internally.

Caddy expects to reach the API by the Docker DNS name `lead-api:3000`, so Compose is the smoother path.

## Cloudflare Tunnel Cutover

1. Deploy the stack on Unraid.
2. Configure a real lead destination in `.env`.
3. Route `preview.southjerseyreal.estate` to the stack.
4. Check `/api/health` through preview.
5. Submit a preview contact form and verify the lead arrives.
6. Check GA4 realtime while visiting preview. The GA measurement ID is baked into the built site.
7. Add or switch the production public hostname to the same origin.
8. Submit one production test lead and verify delivery.

The Caddy config adds `X-Robots-Tag: noindex, nofollow` for `preview.southjerseyreal.estate` so preview traffic is less likely to be indexed.
