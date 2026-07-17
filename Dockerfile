FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
ARG VITE_GA_MEASUREMENT_ID=G-97H86MNHP8
ARG VITE_SUPABASE_URL=https://sinbxruqlaywvbzcvfli.supabase.co
ARG TURNSTILE_WIDGET_ID=0x4AAAAAAD4GwgGgH6mUSw5r
COPY . .
RUN VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_TURNSTILE_SITE_KEY=${TURNSTILE_WIDGET_ID} \
    npm run build

FROM caddy:2-alpine AS web
LABEL org.opencontainers.image.title="South Jersey Real Estate" \
      org.opencontainers.image.description="South Jersey real estate site and lead capture frontend." \
      org.opencontainers.image.source="https://github.com/piskooooo/southjerseyreal.estate" \
      net.unraid.docker.webui="http://[IP]:[PORT:8080]/" \
      net.unraid.docker.icon="https://southjerseyreal.estate/assets/unraid-icon.png"
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
