import type { VeritixConfig } from "./types";
import {
  VeritixError,
  VeritixAuthError,
  VeritixForbiddenError,
  VeritixNotFoundError,
  VeritixConflictError,
  VeritixRateLimitError,
  VeritixValidationError,
  VeritixServiceError,
} from "./errors";
import { buildUrl, isBrowser } from "./utils";
import { AuthClient } from "./auth";
import { EventsClient } from "./events";
import { TicketsClient } from "./tickets";
import { OrganizerClient } from "./organizer";
import { UsersClient } from "./users";

/**
 * Core Veritix SDK client.
 *
 * Provides access to all Veritix API modules via typed sub-clients.
 *
 * @example
 * ```typescript
 * import { VeritixClient } from 'veritix-sdk';
 *
 * const veritix = new VeritixClient({
 *   baseUrl: 'https://your-veritix-instance.com',
 *   token: 'your-jwt-token', // optional, for server-side usage
 * });
 *
 * const { events } = await veritix.events.list({ category: 'Music' });
 * ```
 */
export class VeritixClient {
  private readonly config: Required<
    Pick<VeritixConfig, "baseUrl"> & { fetchFn: typeof globalThis.fetch }
  > &
    VeritixConfig;

  private _auth?: AuthClient;
  private _events?: EventsClient;
  private _tickets?: TicketsClient;
  private _organizer?: OrganizerClient;
  private _users?: UsersClient;

  constructor(config: VeritixConfig) {
    if (!config.baseUrl) {
      throw new Error("VeritixClient requires a `baseUrl` option.");
    }

    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/+$/, ""),
      fetchFn: config.fetch ?? globalThis.fetch.bind(globalThis),
    };
  }

  // ─── Sub-clients (lazy-initialized) ──────────────────────────────────────

  /** Authentication operations (nonce, verify, session). */
  get auth(): AuthClient {
    if (!this._auth) this._auth = new AuthClient(this);
    return this._auth;
  }

  /** Event CRUD and listing. */
  get events(): EventsClient {
    if (!this._events) this._events = new EventsClient(this);
    return this._events;
  }

  /** Ticket purchasing and listing. */
  get tickets(): TicketsClient {
    if (!this._tickets) this._tickets = new TicketsClient(this);
    return this._tickets;
  }

  /** Organizer dashboard operations. */
  get organizer(): OrganizerClient {
    if (!this._organizer) this._organizer = new OrganizerClient(this);
    return this._organizer;
  }

  /** User profile operations. */
  get users(): UsersClient {
    if (!this._users) this._users = new UsersClient(this);
    return this._users;
  }

  // ─── Token management ───────────────────────────────────────────────────

  /**
   * Update the JWT token used for authenticated requests.
   * Useful after a fresh login or token refresh.
   */
  setToken(token: string | undefined): void {
    this.config.token = token;
  }

  /** Get the current base URL. */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  // ─── Internal HTTP methods (used by sub-clients) ────────────────────────

  /**
   * Make an authenticated GET request to the API.
   * @internal
   */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path, params);
    return this.request<T>(url, { method: "GET" });
  }

  /**
   * Make an authenticated POST request to the API.
   * @internal
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make an authenticated PATCH request to the API.
   * @internal
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.request<T>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make an authenticated DELETE request to the API.
   * @internal
   */
  async delete<T>(path: string): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.request<T>(url, { method: "DELETE" });
  }

  // ─── Core request handling ──────────────────────────────────────────────

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);

    // Auth: Bearer token for Node.js, cookies for browsers
    if (this.config.token) {
      headers.set("Authorization", `Bearer ${this.config.token}`);
    }

    // Custom headers
    if (this.config.headers) {
      for (const [key, value] of Object.entries(this.config.headers)) {
        headers.set(key, value);
      }
    }

    // Credentials handling
    let credentials = this.config.credentials;
    if (!credentials && !this.config.token && isBrowser()) {
      credentials = "include";
    }

    const response = await this.config.fetchFn(url, {
      ...init,
      headers,
      credentials,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let body: { error?: string; issues?: unknown } | null = null;
    try {
      body = (await response.json()) as { error?: string; issues?: unknown };
    } catch {
      // Response body is not JSON
    }

    const message = body?.error ?? response.statusText ?? "Request failed";
    const details = body?.issues ?? body;

    switch (response.status) {
      case 400:
        throw new VeritixValidationError(message, details);
      case 401:
        throw new VeritixAuthError(message, details);
      case 403:
        throw new VeritixForbiddenError(message, details);
      case 404:
        throw new VeritixNotFoundError(message, details);
      case 409:
        throw new VeritixConflictError(message, details);
      case 429:
        throw new VeritixRateLimitError(message, details);
      case 503:
        throw new VeritixServiceError(message, details);
      default:
        throw new VeritixError(message, response.status, "API_ERROR", details);
    }
  }
}
