import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { readAuthSession } from '@/lib/auth/session';

export const ssr = false;

export function load({ url }: { url: URL }) {
  if (!browser) {
    return {};
  }

  const authSession = readAuthSession();
  if (!authSession) {
    const returnTo = `${url.pathname}${url.search}`;
    const query = returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    throw redirect(307, `/${query}`);
  }

  return {
    authSession,
  };
}