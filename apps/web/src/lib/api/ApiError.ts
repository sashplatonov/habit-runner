const SAFE_MESSAGES: Record<number, string> = {
  400: 'Check the highlighted fields and try again.',
  401: 'Your session has expired. Sign in again to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested habit could not be found.',
  409: 'This item changed elsewhere. Refresh and try again.',
  429: 'Too many requests. Wait a moment and try again.',
  500: 'The service is temporarily unavailable. Try again shortly.'
};

export type ApiFieldErrors = Record<string, string>;

function safeStatusMessage(status: number): string {
  return SAFE_MESSAGES[status] ?? (status >= 500
    ? 'The service is temporarily unavailable. Try again shortly.'
    : 'The request could not be completed. Try again.');
}

function parseFieldErrors(detail: string | undefined): ApiFieldErrors {
  if (!detail) {
    return {};
  }

  return Object.fromEntries(
    detail
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf(' ');
        return separator > 0
          ? [entry.slice(0, separator).split('.').pop() ?? '', entry.slice(separator + 1).trim()]
          : ['', ''];
      })
      .filter(([field, message]) => field && message)
  );
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly detail: string | null;
  readonly fieldErrors: ApiFieldErrors;
  readonly userMessage: string;

  constructor(status: number, options: { code?: string | null; detail?: string | null } = {}) {
    const fieldErrors = parseFieldErrors(options.detail ?? undefined);
    super(safeStatusMessage(status));
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code ?? null;
    this.detail = options.detail ?? null;
    this.fieldErrors = fieldErrors;
    this.userMessage = status === 400 && Object.keys(fieldErrors).length > 0
      ? 'Check the highlighted fields and try again.'
      : safeStatusMessage(status);
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (typeof payload === 'object' && payload !== null) {
      const record = payload as Record<string, unknown>;
      return new ApiError(response.status, {
        code: typeof record['errorCode'] === 'string' ? record['errorCode'] : null,
        detail: typeof record['detail'] === 'string' ? record['detail'] : null
      });
    }

    return new ApiError(response.status);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function userMessageForError(error: unknown, fallback: string): string {
  return isApiError(error) ? error.userMessage : fallback;
}
