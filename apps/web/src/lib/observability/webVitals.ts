import type { Metric } from 'web-vitals';
import { logBrowser } from '$lib/observability/newrelic';

export function reportWebVital(metric: Metric, pathname: string, isDev = import.meta.env.DEV): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[web-vitals]', metric.name, metric.value, metric.rating);
    return;
  }

  logBrowser('info', 'web_vital', `Web vital ${metric.name}`, {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    url: pathname,
  });
}
