FROM node:22-alpine AS build
WORKDIR /app

# copy package files for workspace install
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY tsconfig.base.json ./

RUN npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps --package-lock=false

# copy shared, build it
COPY packages/shared/ ./packages/shared/
RUN npm run build -w @habbit-runner/shared

# copy web app and build
COPY . ./
# Build-time args — must be declared here so Vite embeds them into the JS bundle.
# Values are supplied via docker-compose build.args (or CI build-args).
ARG VITE_API_BASE_URL
ARG VITE_SYNC_ENABLED
ARG VITE_DEFAULT_USER_ID
ARG VITE_GSC_VERIFICATION_TOKEN
ARG VITE_BING_VERIFICATION_TOKEN
ARG VITE_GA4_MEASUREMENT_ID
# ── Grafana Faro RUM ─────────────────────────────────────────────────────────
ARG VITE_FARO_URL
ARG VITE_FARO_APP_NAME
ARG VITE_FARO_APP_VERSION
ARG VITE_FARO_ENVIRONMENT
ARG VITE_FARO_SAMPLING_RATE
ARG VITE_FARO_PERSISTENT_SESSIONS
ARG VITE_FARO_ENABLED
# Compile service worker source to a JS file expected by workbox injectManifest
# Ensure SvelteKit sync runs to populate .svelte-kit, then compile the service worker
RUN npm run sync:svelte
RUN mkdir -p .svelte-kit/output/client && npx tsc src/service-worker.ts --outFile .svelte-kit/output/client/service-worker.js || true

# Run vite build directly (skip npm prebuild lifecycle to avoid lint/checks in this stage)
# Disable PWA plugin in this environment to avoid injectManifest timing/path issues
RUN SKIP_LINT=1 SKIP_PWA=1 npx vite build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
