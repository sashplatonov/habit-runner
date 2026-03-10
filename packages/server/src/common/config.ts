import 'dotenv/config';

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseOrigins(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const PORT = parseNumber(process.env.PORT, 4000);
export const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-secret';
export const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://habbit:password@localhost:5432/habbit_runner';
export const DEFAULT_DB_SCHEMA =
  process.env.DEFAULT_DB_SCHEMA?.trim() || 'public';
export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? '1h';
export const ACCESS_TOKEN_TTL_SECONDS = parseNumber(
  process.env.ACCESS_TOKEN_TTL_SECONDS,
  3600
);
export const REFRESH_TOKEN_EXPIRES_DAYS = parseNumber(
  process.env.REFRESH_TOKEN_EXPIRES_DAYS,
  30
);
export const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? `http://localhost:${PORT}`;
export const OAUTH_DEFAULT_RETURN_TO =
  process.env.OAUTH_DEFAULT_RETURN_TO ?? 'http://localhost:5173';

export const CORS_ORIGINS = parseOrigins(
  process.env.CORS_ORIGINS,
  ['http://localhost:5173']
);

export const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? '';
export const GOOGLE_OAUTH_CLIENT_SECRET =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';

export const THROTTLE_TTL_SECONDS = parseNumber(
  process.env.THROTTLE_TTL_SECONDS,
  60
);
export const THROTTLE_LIMIT = parseNumber(process.env.THROTTLE_LIMIT, 120);
export const SYNC_OP_LOG_RETENTION_DAYS = parseNumber(
  process.env.SYNC_OP_LOG_RETENTION_DAYS,
  30
);
