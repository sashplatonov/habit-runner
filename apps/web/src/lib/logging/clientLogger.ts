import { logBrowser, noticeBrowserError } from '$lib/observability/newrelic';

type LogLevel = 'info' | 'warn' | 'error';

type LogPayload = {
  event: string;
  message: string;
  context?: Record<string, unknown>;
};

export type ClientLogEntry = LogPayload & {
  level: LogLevel;
  timestamp: string;
};

const CLIENT_LOG_STORAGE_KEY = 'habbit-runner:client-logs';
const MAX_STORED_LOGS = 100;

function write(level: LogLevel, payload: LogPayload) {
  const logEntry: ClientLogEntry = {
    ...payload,
    level,
    timestamp: new Date().toISOString()
  };
  if (typeof window === 'undefined') {
    return;
  }

  logBrowser(level, payload.event, payload.message, payload.context);
  window.dispatchEvent(new CustomEvent('app-client-log', { detail: logEntry }));
  try {
    const existing = window.localStorage.getItem(CLIENT_LOG_STORAGE_KEY);
    const logs = existing ? (JSON.parse(existing) as unknown[]) : [];
    const next = [...logs, logEntry].slice(-MAX_STORED_LOGS);
    window.localStorage.setItem(CLIENT_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Logging must never break app flow when storage is unavailable.
  }
}

export function logClientInfo(
  event: string,
  message: string,
  context?: Record<string, unknown>
) {
  write('info', { event, message, context });
}

export function logClientError(
  event: string,
  message: string,
  context?: Record<string, unknown>
) {
  write('error', { event, message, context });
}

export function readStoredClientLogs(): ClientLogEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const existing = window.localStorage.getItem(CLIENT_LOG_STORAGE_KEY);
    if (!existing) {
      return [];
    }
    const parsed = JSON.parse(existing) as ClientLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function installGlobalClientLogging() {
  const noopDisposer = () => undefined;
  if (typeof window === 'undefined') {
    return noopDisposer;
  }

  const onUiError = (event: Event) => {
    const detail = (event as CustomEvent<Record<string, unknown>>).detail;
    logClientError('ui.error_boundary', 'UI render failed', detail);
  };
  const onUnhandledError = (event: ErrorEvent) => {
    const context = {
      source: event.filename,
      line: event.lineno,
      column: event.colno
    };
    logClientError('ui.window_error', event.message || 'Unhandled window error', context);
    if (event.error) {
      noticeBrowserError(event.error, context);
    }
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const context = {
      reason:
        event.reason instanceof Error
          ? { message: event.reason.message, stack: event.reason.stack }
          : String(event.reason)
    };
    logClientError('ui.unhandled_rejection', 'Unhandled promise rejection', context);
    noticeBrowserError(event.reason, context);
  };

  window.addEventListener('app-ui-error', onUiError);
  window.addEventListener('error', onUnhandledError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('app-ui-error', onUiError);
    window.removeEventListener('error', onUnhandledError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
