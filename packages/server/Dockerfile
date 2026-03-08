FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY tsconfig.base.json ./

RUN npm ci --workspace=@habbit-runner/shared --workspace=@habbit-runner/server

COPY packages/shared/ packages/shared/
RUN npm run build -w @habbit-runner/shared

COPY packages/server/ packages/server/
WORKDIR /app/packages/server
RUN npx prisma generate
WORKDIR /app
RUN npm run build -w @habbit-runner/server

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl ca-certificates

COPY --from=base /app/package.json /app/package-lock.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/packages/server/prisma ./prisma
COPY --from=base /app/packages/server/prisma.config.ts ./prisma.config.ts
COPY --from=base /app/packages/server/dist ./dist
COPY --from=base /app/packages/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && chown -R node:node /app

USER node
EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
