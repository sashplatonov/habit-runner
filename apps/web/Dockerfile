FROM node:22-alpine AS build
WORKDIR /work/apps/web

# copy package files for workspace install
COPY apps/web/package*.json ./
COPY apps/web/packages/shared/package.json ./packages/shared/
COPY apps/web/tsconfig.base.json ./

RUN npm ci --ignore-scripts

# copy shared, build it
COPY apps/web/packages/shared/ ./packages/shared/
RUN npm run build -w @habbit-runner/shared

# copy web app and build
COPY apps/web/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build -w @habbit-runner/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /work/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
