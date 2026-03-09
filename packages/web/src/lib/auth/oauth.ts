import { API_BASE_URL } from '@/lib/core/config';

export function startOAuthLogin() {
  const returnTo = window.location.origin;
  const url = new URL(`${API_BASE_URL}/auth/google/start`);
  url.searchParams.set('returnTo', returnTo);
  window.location.assign(url.toString());
}
