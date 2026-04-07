import { buildApiUrl } from '$lib/api/url';

export function startOAuthLogin() {
  const returnTo = window.location.origin;
  const url = new URL(buildApiUrl('/auth/google/start'));
  url.searchParams.set('returnTo', returnTo);
  window.location.assign(url.toString());
}
