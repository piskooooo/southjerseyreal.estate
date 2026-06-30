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
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 8080
