import { initFaro } from '$lib/observability/faro';
import { installGlobalClientLogging, logClientError } from '$lib/logging/clientLogger';

let initialized = false;

export async function init(): Promise<void> {
  if (initialized) {
    return;
  }

  initialized = true;
  installGlobalClientLogging();
  await initFaro();
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
    path: event.url.pathname,
    status,
  });

  return {
    message,
  };
}