import { API_BASE_URL } from '$lib/core/config';

function normalizePath(base: string) {
  return base.replace(/\/+$/, '');
}

function ensureAbsolute(base: string) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(base)) {
    return base;
  }
  const origin = window.location.origin;
  return `${origin}${base.startsWith('/') ? '' : '/'}${base}`;
}

export function buildApiUrl(path: string) {
  const normalizedBase = normalizePath(API_BASE_URL);
  const fullBase = ensureAbsolute(normalizedBase);
  return `${fullBase}${path.startsWith('/') ? path : `/${path}`}`;
}
