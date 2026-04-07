FROM node:22-alpine AS build
WORKDIR /app

# Base files needed for building shared and web-svelte
COPY apps/web/tsconfig.base.json ./apps/web/tsconfig.base.json
COPY apps/web/tsconfig.base.json ./tsconfig.base.json
COPY apps/web/packages/shared/package.json ./apps/web/packages/shared/package.json
COPY apps/web-svelte/package.json ./apps/web-svelte/package.json

# Install system build deps
RUN apk add --no-cache bash git python3 make g++

# Copy and build shared package in the path expected by vite alias
COPY apps/web/packages/shared ./apps/web/packages/shared
RUN cd apps/web/packages/shared && npm install --no-audit --no-fund && npm run build

# Copy web-svelte sources and build
COPY apps/web-svelte ./apps/web-svelte
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN cd apps/web-svelte && npm install --no-audit --no-fund && npm run build

FROM nginx:1.27-alpine AS runtime
# Copy Svelte build output
COPY --from=build /app/apps/web-svelte/build /usr/share/nginx/html
# Copy custom nginx config to enable /api proxying
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
# Use default nginx config; expose port 80
EXPOSE 80
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;' -c /etc/nginx/nginx.conf"]
