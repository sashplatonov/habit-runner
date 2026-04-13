function isAbsoluteHttpUrl(value: string | undefined) {
  return Boolean(value && /^https?:\/\//.test(value));
}

export function resolveApiProxyTarget(
  apiTargetUrl?: string,
  apiBaseUrl?: string,
  fallback = 'http://localhost:3000'
) {
  if (isAbsoluteHttpUrl(apiTargetUrl)) {
    return apiTargetUrl as string;
  }

  if (isAbsoluteHttpUrl(apiBaseUrl)) {
    return apiBaseUrl as string;
  }

  return fallback;
}
