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
# Build-time args only.  Defaults must live in the repo root `.env` or CI.
ARG VITE_API_BASE_URL
# Grafana Faro build-time args (do not set runtime ENV here)
ARG VITE_FARO_ENABLED
ARG VITE_FARO_URL
ARG VITE_FARO_APP_NAME
ARG VITE_FARO_APP_VERSION
ARG VITE_FARO_ENVIRONMENT
ARG VITE_FARO_SAMPLING_RATE
ARG VITE_FARO_PERSISTENT_SESSIONS
# Run the root build (the package itself is the root package, not a workspace member)
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
