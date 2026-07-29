import type { ApiErrorResponse, ApiErrorSubError } from '@e-commerce/contracts';

export type TApiErrorInit = {
  statusCode: number;
  message: string;
  error: string;
  correlationId?: string;
  subErrors?: ApiErrorSubError[];
};

// A failed API response, carrying the server's error envelope. Anything without
// a status (a dead API, an offline browser) stays a plain Error instead.
export class ApiError extends Error {
  readonly name = 'ApiError';
  readonly statusCode: number;
  readonly error: string;
  readonly correlationId?: string;
  readonly subErrors?: ApiErrorSubError[];

  constructor(init: TApiErrorInit) {
    super(init.message);
    this.statusCode = init.statusCode;
    this.error = init.error;
    this.correlationId = init.correlationId;
    this.subErrors = init.subErrors;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

// The proxy answers with HTML when the upstream is unreachable, so the envelope
// is best-effort: fall back to whatever the response line tells us.
export async function toApiError(response: Response): Promise<ApiError> {
  const fallback = {
    statusCode: response.status,
    message:
      response.statusText || `Request failed with status ${response.status}`,
    error: response.statusText || 'Request failed',
  };

  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;

    return new ApiError({
      statusCode: body.statusCode ?? fallback.statusCode,
      message: body.message ?? fallback.message,
      error: body.error ?? fallback.error,
      correlationId: body.correlationId,
      subErrors: body.subErrors,
    });
  } catch {
    return new ApiError(fallback);
  }
}
