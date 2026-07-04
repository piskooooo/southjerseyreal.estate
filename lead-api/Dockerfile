FROM node:22-alpine
WORKDIR /app
LABEL org.opencontainers.image.title="South Jersey Real Estate Lead API" \
      org.opencontainers.image.description="Lead capture API for the South Jersey Real Estate site." \
      org.opencontainers.image.source="https://github.com/piskooooo/southjerseyreal.estate" \
      net.unraid.docker.icon="https://southjerseyreal.estate/assets/unraid-icon.png"
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
