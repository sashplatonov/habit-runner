FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api-nest-legacy/package.json apps/api-nest-legacy/
COPY tsconfig.base.json ./

RUN npm ci --ignore-scripts --workspace=@habbit-runner/shared --workspace=@habbit-runner/server

COPY packages/shared/ packages/shared/
RUN npm run build -w @habbit-runner/shared

COPY apps/api-nest-legacy/ apps/api-nest-legacy/
WORKDIR /app/apps/api-nest-legacy
RUN npx prisma generate
WORKDIR /app
RUN npm run build -w @habbit-runner/server

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl ca-certificates

COPY --from=base /app/package.json /app/package-lock.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/apps/api-nest-legacy/package.json ./apps/api-nest-legacy/package.json
COPY --from=base /app/apps/api-nest-legacy/node_modules ./apps/api-nest-legacy/node_modules
COPY --from=base /app/apps/api-nest-legacy/prisma ./apps/api-nest-legacy/prisma
COPY --from=base /app/apps/api-nest-legacy/prisma.config.ts ./apps/api-nest-legacy/prisma.config.ts
COPY --from=base /app/apps/api-nest-legacy/dist ./apps/api-nest-legacy/dist
COPY --from=base /app/apps/api-nest-legacy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && chown -R node:node /app

USER node
WORKDIR /app/apps/api-nest-legacy
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
