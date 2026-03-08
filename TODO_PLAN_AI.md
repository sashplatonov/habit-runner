Habbit Runner — Миграция на npm workspaces (монорепо)

Контекст

Сейчас проект — неформальный монорепо: фронт в корне (src/, package.json), бэкенд в server/. Проблемы:
- Корневой package.json одновременно workspace root и пакет фронтенда
- 6 типов дублируются между src/types/sync.ts и server/src/sync/dto/*.ts (HabitDto, CheckinDto, TombstoneDto, PullResponseDto, PushResponseDto, PushConflict)
- Константы SyncEntity, SyncOpType определены в обоих проектах независимо
- HabitColor, HabitFrequency существуют только на фронте, бэкенд хранит как string
- Единый npm install не работает, нужно два отдельных
- Нет возможности независимо билдить/деплоить

Цель: формальный монорепо с npm workspaces, shared-пакет для общих типов.

Целевая структура

habbit-runner/
├── package.json              # workspace root (private, no app code)
├── tsconfig.base.json        # базовый TS конфиг
├── turbo.json                # (опционально, этап 3)
├── docker-compose.yml
├── .eslintrc.cjs
├── packages/
│   ├── web/                  # <- текущий src/ + vite конфиги
│   │   ├── package.json      # name: @habbit-runner/web
│   │   ├── tsconfig.json     # extends ../../tsconfig.base.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   └── src/              # <- текущий src/
│   │       ├── App.tsx
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── pages/
│   │       └── types/        # только фронт-специфичные типы
│   │
│   ├── server/               # <- текущий server/
│   │   ├── package.json      # name: @habbit-runner/server
│   │   ├── tsconfig.json     # extends ../../tsconfig.base.json
│   │   ├── prisma/
│   │   └── src/
│   │
│   └── shared/               # НОВЫЙ пакет
│       ├── package.json      # name: @habbit-runner/shared
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # реэкспорт всего
│           ├── sync.ts       # HabitDto, CheckinDto, TombstoneDto, PullResponseDto, PushResponseDto, PushConflict, SyncOpDto
│           ├── habit.ts      # HabitColor, HabitFrequency + значения-константы
│           └── auth.ts       # AuthTokenResponse (общий тип ответа auth)

 ---
Этап 1 — Подготовка workspace root (S, ~2ч)

Задачи

1.1 Создать packages/web/ и packages/server/
- mkdir -p packages/web packages/server packages/shared

1.2 Переместить файлы фронтенда в packages/web/
- Переместить: src/, public/, index.html, vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig.json, tsconfig.node.json, .eslintrc.cjs
- НЕ перемещать: docker-compose.yml, .gitignore, .env.example, CLAUDE.md, AGENTS.md, docs/

1.3 Переместить server/ в packages/server/
- mv server/* packages/server/

1.4 Создать корневой package.json
{
"name": "habbit-runner",
"private": true,
"workspaces": ["packages/*"],
"scripts": {
"dev": "npm run dev --workspace=@habbit-runner/web",
"dev:server": "npm run dev --workspace=@habbit-runner/server",
"dev:all": "npm run dev --workspaces --if-present",
"build": "npm run build --workspaces --if-present",
"build:web": "npm run build --workspace=@habbit-runner/web",
"build:server": "npm run build --workspace=@habbit-runner/server",
"lint": "npm run lint --workspaces --if-present",
"clean": "npm run clean --workspaces --if-present"
}
}

1.5 Обновить packages/web/package.json
- name: @habbit-runner/web
- Обновить пути в скриптах если нужно

1.6 Обновить packages/server/package.json
- name: @habbit-runner/server
- Обновить prisma пути

1.7 Создать tsconfig.base.json в корне
{
"compilerOptions": {
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"forceConsistentCasingInFileNames": true,
"resolveJsonModule": true,
"declaration": true,
"declarationMap": true,
"sourceMap": true
}
}

Проверка этапа 1

npm install                    # из корня — должен установить все workspace deps
npm run build:web              # фронт билдится
npm run build:server           # сервер билдится
npm run lint                   # линтер проходит
npm run dev                    # dev server стартует

 ---
Этап 2 — Shared-пакет с типами (M, ~4ч)

Задачи

2.1 Создать packages/shared/package.json
{
"name": "@habbit-runner/shared",
"version": "0.0.1",
"private": true,
"type": "module",
"main": "./dist/index.js",
"types": "./dist/index.d.ts",
"exports": {
".": {
"types": "./dist/index.d.ts",
"import": "./dist/index.js"
}
},
"scripts": {
"build": "tsc",
"clean": "rm -rf dist"
},
"devDependencies": {
"typescript": "^5.x"
}
}

2.2 Создать packages/shared/tsconfig.json
{
"extends": "../../tsconfig.base.json",
"compilerOptions": {
"outDir": "dist",
"rootDir": "src",
"module": "ESNext",
"moduleResolution": "bundler",
"target": "ES2022"
},
"include": ["src"]
}

2.3 Создать packages/shared/src/sync.ts — вынести общие типы
Перенести из src/types/sync.ts и server/src/sync/dto/*.ts:
// --- Константы ---
export const SYNC_ENTITY_VALUES = ['habit', 'checkin'] as const;
export type SyncEntity = (typeof SYNC_ENTITY_VALUES)[number];

export const SYNC_OP_TYPE_VALUES = ['upsert', 'delete'] as const;
export type SyncOpType = (typeof SYNC_OP_TYPE_VALUES)[number];

// --- DTOs ---
export interface HabitDto {
id: string;
name: string;
description: string | null;
color: string;
icon: string;
frequency: string;
customDays?: unknown;
targetStreak: number;
tags?: unknown;
archived: boolean;
createdAt: string;
updatedAt: string;
version: number;
}

export interface CheckinDto {
id: string;
habitId: string;
date: string;
done: boolean;
updatedAt: string;
version: number;
}

export interface TombstoneDto {
id: string;
entity: string;
entityId: string;
deletedAt: string;
version: number;
}

export interface PullResponseDto {
habits: HabitDto[];
checkins: CheckinDto[];
tombstones: TombstoneDto[];
nextCursor?: string;
serverTime: string;
}

export interface PushConflict {
opId: string;
reason: string;
serverValue?: unknown;
}

export interface PushResponseDto {
applied: string[];
conflicts: PushConflict[];
serverTime: string;
}

export interface SyncOpDto {
id: string;
entity: SyncEntity;
type: SyncOpType;
payload: Record<string, unknown>;
clientTime: string;
}

2.4 Создать packages/shared/src/habit.ts
export const HABIT_COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'cyan'] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export const HABIT_FREQUENCIES = ['daily', 'weekdays', 'weekends', 'custom'] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

2.5 Создать packages/shared/src/auth.ts
export interface AuthTokenResponse {
accessToken: string;
refreshToken: string;
expiresIn: number;
tokenType: string;
}

2.6 Создать packages/shared/src/index.ts — реэкспорт
export * from './sync';
export * from './habit';
export * from './auth';

2.7 Добавить зависимость shared в web и server
# packages/web/package.json
"dependencies": {
"@habbit-runner/shared": "*"
}
# packages/server/package.json
"dependencies": {
"@habbit-runner/shared": "*"
}

2.8 Обновить импорты во фронтенде
- src/types/sync.ts — удалить дублирующие типы, реэкспортировать из shared:
  export type { HabitDto, CheckinDto, TombstoneDto, PullResponseDto, PushResponseDto, PushConflict, SyncOpDto } from '@habbit-runner/shared';
- src/types/habit.ts — импортировать HabitColor, HabitFrequency из shared
- src/lib/storage/db.ts — импортировать SyncEntity, SyncOpType из shared

2.9 Обновить импорты на сервере
- server/src/sync/dto/pull-response.dto.ts — реэкспортировать из shared
- server/src/sync/dto/push-request.dto.ts — импортировать базовые интерфейсы из shared, оставить class-validator декораторы в локальных классах, имплементирующих shared-интерфейсы
- server/src/auth/auth.service.ts — использовать HabitColor для валидации цвета

Проверка этапа 2

npm run build -w @habbit-runner/shared   # shared билдится
npm run build                             # все 3 пакета билдятся
npm run lint                              # линтер проходит
npm run dev                               # фронт стартует, подхватывает shared типы
cd packages/server && npm run dev         # сервер стартует
Функциональная проверка:
- Открыть приложение, создать привычку, отметить чекин — синхронизация работает
- Типы в IDE резолвятся из @habbit-runner/shared

 ---
Этап 3 — Docker и CI адаптация (M, ~3ч)

Задачи

3.1 Обновить docker-compose.yml
- Изменить context и dockerfile пути:
  api:
  build:
  context: .
  dockerfile: packages/server/Dockerfile
  web:
  build:
  context: .
  dockerfile: packages/web/Dockerfile
- Context = корень (чтобы COPY shared работал)

3.2 Обновить packages/server/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Копируем workspace root
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm ci --workspace=@habbit-runner/shared --workspace=@habbit-runner/server

COPY packages/shared/ packages/shared/
RUN npm run build -w @habbit-runner/shared

COPY packages/server/ packages/server/
RUN npm run build -w @habbit-runner/server

# ... production stage

3.3 Обновить packages/web/Dockerfile (бывший Dockerfile.web)
- Аналогичная структура: сначала shared, потом web

3.4 Обновить .dockerignore
- Добавить: packages/*/node_modules, packages/*/dist

3.5 Обновить CLAUDE.md и AGENTS.md
- Команды: npm run dev / npm run dev:server / npm run build из корня
- Структура: описать packages/

Проверка этапа 3

docker compose build           # все образы собираются
docker compose up --build      # стек стартует, web + api + db работают
# Открыть http://localhost:5173, залогиниться, проверить синхронизацию

 ---
Этап 4 (опционально) — Turborepo для кэширования (S, ~1ч)

Задачи

4.1 Установить turbo
npm install -D turbo

4.2 Создать turbo.json
{
"$schema": "https://turbo.build/schema.json",
"tasks": {
"build": {
"dependsOn": ["^build"],
"outputs": ["dist/**"]
},
"dev": {
"cache": false,
"persistent": true
},
"lint": {
"dependsOn": ["^build"]
},
"clean": {
"cache": false
}
}
}

4.3 Обновить корневые скрипты на turbo
{
"scripts": {
"dev": "turbo dev",
"build": "turbo build",
"lint": "turbo lint"
}
}

Проверка этапа 4

npx turbo build          # билдит shared -> web + server (параллельно)
npx turbo build          # второй раз — cache hit, мгновенно
npx turbo lint           # линт всех пакетов

 ---
Ключевые файлы для модификации

┌─────────────────────────────────────────────────┬─────────────────────────────────────────────┐
│                      Файл                       │                  Действие                   │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ package.json (корень)                           │ Полная перезапись — workspace root          │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ src/ -> packages/web/src/                       │ Перемещение                                 │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ server/ -> packages/server/                     │ Перемещение                                 │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ packages/shared/                                │ Новый пакет                                 │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ src/types/sync.ts                               │ Удалить дубли, реэкспорт из shared          │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ src/types/habit.ts                              │ Импорт HabitColor, HabitFrequency из shared │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ src/lib/storage/db.ts                           │ Импорт SyncEntity, SyncOpType из shared     │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ server/src/sync/dto/pull-response.dto.ts        │ Реэкспорт из shared                         │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ server/src/sync/dto/push-request.dto.ts         │ Импорт базовых типов из shared              │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ docker-compose.yml                              │ Обновить build context/dockerfile пути      │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ Dockerfile.web -> packages/web/Dockerfile       │ Переписать для workspace                    │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ server/Dockerfile -> packages/server/Dockerfile │ Переписать для workspace                    │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ vite.config.ts -> packages/web/vite.config.ts   │ Обновить пути алиасов                       │
├─────────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ CLAUDE.md, AGENTS.md                            │ Обновить команды и описание структуры       │
└─────────────────────────────────────────────────┴─────────────────────────────────────────────┘

Что НЕ трогаем

- Prisma schema и миграции — остаются в packages/server/prisma/
- Логика sync engine, auth, hooks — только импорты меняются
- .env файлы — остаются при своих пакетах
- Бизнес-логика компонентов — без изменений

Риски и fallback

- git history: git mv сохраняет историю. Делать одним коммитом (только перемещение), без рефакторинга
- path aliases: @/ в vite.config.ts нужно обновить на ./src/ или пересоздать
- Prisma generate: путь к prisma/schema.prisma меняется — обновить в packages/server/package.json prisma секцию
- CI: если есть GitHub Actions — обновить пути. Сейчас CI нет, не блокер

Порядок коммитов

1. refactor: move frontend to packages/web — только перемещение файлов, обновление путей
2. refactor: move server to packages/server — только перемещение
3. feat: add @habbit-runner/shared package — новый пакет + обновление импортов
4. chore: update docker and docs for monorepo — docker, CLAUDE.md
5. chore: add turborepo (опционально)

Финальная верификация

# 1. Чистая установка
rm -rf node_modules packages/*/node_modules
npm install

# 2. Билды
npm run build                  # все 3 пакета

# 3. Dev режим
npm run dev &                  # фронт на :5173
npm run dev:server &           # сервер на :4000

# 4. Функциональная проверка
# - Открыть http://localhost:5173
# - Залогиниться через Google OAuth
# - Создать привычку, отметить дни
# - Проверить синхронизацию (Network tab)
# - Обновить страницу — данные на месте

# 5. Docker
docker compose up --build      # всё стартует

# 6. IDE check
# - Cmd+Click на импорт из @habbit-runner/shared — переходит к определению
# - Изменить тип в shared — TS ошибки появляются в web и server.