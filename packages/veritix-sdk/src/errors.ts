/**
 * Base error class for all Veritix SDK errors.
 * Provides HTTP status, a machine-readable code, and optional details.
 */
export class VeritixError extends Error {
  /** HTTP status code from the API response. */
  public readonly status: number;
  /** Machine-readable error code. */
  public readonly code: string;
  /** Additional details (e.g. validation issues). */
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "VeritixError";
    this.status = status;
    this.code = code ?? "VERITIX_ERROR";
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the request is not authenticated (HTTP 401).
 */
export class VeritixAuthError extends VeritixError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
    this.name = "VeritixAuthError";
  }
}

/**
 * Thrown when the user lacks permission for the action (HTTP 403).
 */
export class VeritixForbiddenError extends VeritixError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);
    this.name = "VeritixForbiddenError";
  }
}

/**
 * Thrown when the requested resource is not found (HTTP 404).
 */
export class VeritixNotFoundError extends VeritixError {
  constructor(message = "Not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
    this.name = "VeritixNotFoundError";
  }
}

/**
 * Thrown when a conflict occurs (HTTP 409), e.g. duplicate ticket purchase.
 */
export class VeritixConflictError extends VeritixError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
    this.name = "VeritixConflictError";
  }
}

/**
 * Thrown when the rate limit is exceeded (HTTP 429).
 */
export class VeritixRateLimitError extends VeritixError {
  constructor(message = "Too many requests", details?: unknown) {
    super(message, 429, "RATE_LIMITED", details);
    this.name = "VeritixRateLimitError";
  }
}

/**
 * Thrown when the server returns a validation error (HTTP 400).
 */
export class VeritixValidationError extends VeritixError {
  constructor(message = "Invalid input", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "VeritixValidationError";
  }
}

/**
 * Thrown when the server is temporarily unavailable (HTTP 503).
 */
export class VeritixServiceError extends VeritixError {
  constructor(message = "Service unavailable", details?: unknown) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
    this.name = "VeritixServiceError";
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 */
export class VeritixTimeoutError extends VeritixError {
  constructor(message = "Request timed out", details?: unknown) {
    super(message, 0, "TIMEOUT", details);
    this.name = "VeritixTimeoutError";
  }
}
