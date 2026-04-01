type RuntimeCacheRequest = {
  mode?: string;
};

type RuntimeCacheUrl = {
  origin: string;
  pathname: string;
};

export function shouldCacheAppShell(request: RuntimeCacheRequest, url: RuntimeCacheUrl) {
  if (request.mode !== 'navigate') {
    return false;
  }

  if (typeof self !== 'undefined' && url.origin !== self.location.origin) {
    try {
      // compare hostname only (ignore dev ports) so tests running in jsdom
      // and dev servers that use different ports still treat localhost as same-origin
      const reqHost = new URL(url.origin).hostname;
      const selfHost = (self.location && self.location.hostname) ? self.location.hostname : '';
      if (reqHost !== selfHost) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return !url.pathname.startsWith('/api');
}
