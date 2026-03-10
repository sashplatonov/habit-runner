FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
COPY tsconfig.base.json ./

RUN npm ci --workspace=@habbit-runner/shared --workspace=@habbit-runner/web

COPY packages/shared/ packages/shared/
RUN npm run build -w @habbit-runner/shared

COPY packages/web/ packages/web/
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build -w @habbit-runner/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
