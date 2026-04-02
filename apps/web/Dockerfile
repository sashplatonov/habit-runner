FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY tsconfig.base.json ./

RUN npm ci --ignore-scripts --workspace=@habbit-runner/shared --workspace=@habbit-runner/web

COPY packages/shared/ packages/shared/
RUN npm run build -w @habbit-runner/shared

COPY apps/web/ apps/web/
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build -w @habbit-runner/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
