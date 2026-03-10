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
    return false;
  }

  return !url.pathname.startsWith('/api');
}
