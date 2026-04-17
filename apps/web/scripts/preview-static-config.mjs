const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function resolvePreviewApiTarget(host, explicitTarget, fallback = 'http://localhost:3000') {
  const normalizedTarget = typeof explicitTarget === 'string' ? explicitTarget.trim() : '';
  if (normalizedTarget.length > 0) {
    return normalizedTarget;
  }

  return LOOPBACK_HOSTS.has(host) ? fallback : '';
}

export function buildPreviewProxyUrl(requestUrl, proxyApiTarget) {
  const normalizedRequestUrl = typeof requestUrl === 'string' ? requestUrl : '/';
  const rewrittenPath = normalizedRequestUrl.startsWith('/api/')
    ? normalizedRequestUrl.slice(4)
    : normalizedRequestUrl === '/api'
      ? '/'
      : normalizedRequestUrl;

  return new URL(rewrittenPath, proxyApiTarget).toString();
}