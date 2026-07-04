FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
ARG VITE_GA_MEASUREMENT_ID=G-97H86MNHP8
ARG VITE_LEAD_API_PATH=/api/leads
ENV VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID}
ENV VITE_LEAD_API_PATH=${VITE_LEAD_API_PATH}
COPY . .
RUN npm run build

FROM caddy:2-alpine AS web
LABEL org.opencontainers.image.title="South Jersey Real Estate" \
      org.opencontainers.image.description="South Jersey real estate site and lead capture frontend." \
      org.opencontainers.image.source="https://github.com/piskooooo/southjerseyreal.estate" \
      net.unraid.docker.webui="http://[IP]:[PORT:8080]/" \
      net.unraid.docker.icon="https://southjerseyreal.estate/assets/unraid-icon.png"
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
