import type { Metric } from 'web-vitals';
import { trackWebVital } from '$lib/observability/faro';

export function reportWebVital(metric: Metric, pathname: string, isDev = import.meta.env.DEV): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[web-vitals]', metric.name, metric.value, metric.rating);
    return;
  }

  trackWebVital({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    url: pathname,
  });
}