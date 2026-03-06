FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
COPY prisma ./prisma
COPY .env ./

RUN npx prisma generate

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node -r ts-node/register/transpile-only src/main.ts"]
