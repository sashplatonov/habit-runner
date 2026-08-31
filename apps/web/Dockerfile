# syntax=docker/dockerfile:1.7
FROM node:22.23.1 AS build
WORKDIR /app

# Bound Vite/esbuild memory when this image is built alongside the API image.
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Copy dependency manifests first so npm install stays cached across source changes.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY tsconfig.base.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund --legacy-peer-deps

# copy shared, build it
COPY packages/shared/ ./packages/shared/
RUN npm run build -w @habbit-runner/shared

# copy web app and build
COPY . ./
# Build-time args — must be declared here so Vite embeds them into the JS bundle.
# Values are supplied via docker-compose build.args (or CI build-args).
ARG VITE_API_BASE_URL
ARG VITE_DEFAULT_USER_ID
ARG VITE_GSC_VERIFICATION_TOKEN
ARG VITE_BING_VERIFICATION_TOKEN
ARG VITE_GA4_MEASUREMENT_ID
ARG VITE_TELEGRAM_BOT_USERNAME
# ── New Relic Browser ────────────────────────────────────────────────────────
ARG VITE_NEW_RELIC_BROWSER_ENABLED
ARG VITE_NEW_RELIC_BROWSER_INFO
ARG VITE_NEW_RELIC_BROWSER_INIT
ARG VITE_NEW_RELIC_BROWSER_LOADER_CONFIG
# Compile service worker source to a JS file expected by workbox injectManifest
# Ensure SvelteKit sync runs to populate .svelte-kit, then compile the service worker
RUN npm run sync:svelte
RUN mkdir -p .svelte-kit/output/client && npx esbuild src/service-worker.ts --bundle --platform=browser --outfile=.svelte-kit/output/client/service-worker.js

# Run vite build directly (skip npm prebuild lifecycle to avoid lint/checks in this stage)
# Enable PWA plugin during Docker build so the service worker and manifest are included
RUN npx vite build

FROM nginx:1.31.2 AS runtime
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends wget; \
    rm -rf /var/lib/apt/lists/*
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown -R nginx:nginx /etc/nginx /var/cache/nginx /var/run
EXPOSE 80
USER nginx
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
