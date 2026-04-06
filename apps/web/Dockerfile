FROM node:22-alpine AS build
WORKDIR /app

# copy package files for workspace install
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY tsconfig.base.json ./

RUN npm ci --ignore-scripts

# copy shared, build it
COPY packages/shared/ ./packages/shared/
RUN npm run build -w @habbit-runner/shared

# copy web app and build
COPY . ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build -w @habbit-runner/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
