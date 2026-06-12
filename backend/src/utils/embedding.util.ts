export const NO_RIDES_YET_TEXT = 'start: no data; end: no data';

export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('429') ||
    error.message.toLowerCase().includes('rate limit') ||
    error.message.toLowerCase().includes('quota')
  );
}

/**
 * Returns true if the error is a server-side error (5xx) that may resolve on retry.
 */
export function isServerError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /\b5\d{2}\b/.test(error.message);
}

/**
 * Returns true if the error is a client error (4xx) that should NOT be retried.
 */
export function isClientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // Match 4xx but exclude 429 (rate limit)
  return /\b4(?!29)\d{2}\b/.test(error.message);
}

/**
 * Returns true if the error should be retried by Bull.
 * Retryable: rate limits (429) and server errors (5xx).
 * Non-retryable: client errors (400, 401, 403, etc.)
 */
export function isRetryableError(error: unknown): boolean {
  return isRateLimitError(error) || isServerError(error);
}
