import { installGlobalClientLogging, logClientError } from '$lib/logging/clientLogger';
import { initNewRelicBrowser, noticeBrowserError } from '$lib/observability/newrelic';
import { reportWebVital } from '$lib/observability/webVitals';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

let initialized = false;

function reportVital(metric: Metric): void {
  reportWebVital(metric, window.location.pathname);
}

async function registerServiceWorker(): Promise<void> {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
  } catch (error) {
    logClientError('service_worker.registration_failed', 'Service worker registration failed', {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : {
              value: String(error),
            },
      path: window.location.pathname,
    });
  }
}


export async function init(): Promise<void> {
  if (initialized) {
    return;
  }

  initialized = true;
  await initNewRelicBrowser();
  installGlobalClientLogging();
  void registerServiceWorker();

  // Report Core Web Vitals without blocking main thread
  onCLS(reportVital);
  onFCP(reportVital);
  onINP(reportVital);
  onLCP(reportVital);
  onTTFB(reportVital);
}

type ClientErrorInput = {
  error: unknown;
  event: {
    url: URL;
  };
  message: string;
  status: number;
};

export function handleError({ error, event, message, status }: ClientErrorInput) {
  const context = {
    event: 'sveltekit.client_error',
    path: event.url.pathname,
    status
  };

  logClientError('sveltekit.client_error', message, {
    error:
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : {
            value: String(error),
          },
    ...context
  });
  noticeBrowserError(error, context);

  return {
    message,
  };
}
