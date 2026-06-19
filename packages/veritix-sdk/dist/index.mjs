// src/errors.ts
var VeritixError = class extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "VeritixError";
    this.status = status;
    this.code = code ?? "VERITIX_ERROR";
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var VeritixAuthError = class extends VeritixError {
  constructor(message = "Unauthorized", details) {
    super(message, 401, "UNAUTHORIZED", details);
    this.name = "VeritixAuthError";
  }
};
var VeritixForbiddenError = class extends VeritixError {
  constructor(message = "Forbidden", details) {
    super(message, 403, "FORBIDDEN", details);
    this.name = "VeritixForbiddenError";
  }
};
var VeritixNotFoundError = class extends VeritixError {
  constructor(message = "Not found", details) {
    super(message, 404, "NOT_FOUND", details);
    this.name = "VeritixNotFoundError";
  }
};
var VeritixConflictError = class extends VeritixError {
  constructor(message = "Conflict", details) {
    super(message, 409, "CONFLICT", details);
    this.name = "VeritixConflictError";
  }
};
var VeritixRateLimitError = class extends VeritixError {
  constructor(message = "Too many requests", details) {
    super(message, 429, "RATE_LIMITED", details);
    this.name = "VeritixRateLimitError";
  }
};
var VeritixValidationError = class extends VeritixError {
  constructor(message = "Invalid input", details) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "VeritixValidationError";
  }
};
var VeritixServiceError = class extends VeritixError {
  constructor(message = "Service unavailable", details) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
    this.name = "VeritixServiceError";
  }
};
var VeritixTimeoutError = class extends VeritixError {
  constructor(message = "Request timed out", details) {
    super(message, 0, "TIMEOUT", details);
    this.name = "VeritixTimeoutError";
  }
};

// src/utils.ts
function buildUrl(baseUrl, path, params) {
  const base = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const url = `${base}/${cleanPath}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== void 0 && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function stxToMicroStx(stx) {
  const value = typeof stx === "string" ? parseFloat(stx) : stx;
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid STX amount: ${stx}`);
  }
  return Math.round(value * 1e6).toString();
}
function microStxToStx(microStx) {
  const value = typeof microStx === "string" ? parseInt(microStx, 10) : microStx;
  return (value / 1e6).toString();
}

// src/auth.ts
var AuthClient = class {
  /** @internal */
  constructor(client) {
    this.client = client;
  }
  /**
   * Request an authentication nonce for a Stacks address.
   *
   * The response includes a `message` string that the user must sign
   * with their wallet to authenticate.
   *
   * @param address - The Stacks wallet address (e.g. "SP1ABC...")
   * @returns Nonce, message to sign, and timestamp
   */
  async getNonce(address) {
    return this.client.post("/api/auth/nonce", { address });
  }
  /**
   * Verify a signed authentication message and establish a session.
   *
   * On success, if the client is in cookie mode (browser), the session
   * cookie is set automatically. In token mode, the returned token
   * should be stored and passed to `client.setToken()`.
   *
   * @param input - Address, public key, signature, and issuedAt timestamp
   * @returns The authenticated user profile
   */
  async verify(input) {
    return this.client.post("/api/auth/verify", input);
  }
  /**
   * Get the currently authenticated user, or `null` if not logged in.
   */
  async me() {
    const data = await this.client.get("/api/auth/me");
    return data.user;
  }
  /**
   * Log out and clear the session.
   */
  async logout() {
    await this.client.post("/api/auth/logout");
  }
};

// src/events.ts
var EventsClient = class {
  /** @internal */
  constructor(client) {
    this.client = client;
  }
  /**
   * List events with optional filtering and pagination.
   *
   * @param params - Filter by category, status, organizer, search query, and pagination
   * @returns Paginated list of events with total count
   */
  async list(params = {}) {
    const query = {};
    if (params.category) query.category = params.category;
    if (params.status) query.status = params.status;
    if (params.organizer) query.organizer = params.organizer;
    if (params.q) query.q = params.q;
    if (params.limit !== void 0) query.limit = params.limit;
    if (params.offset !== void 0) query.offset = params.offset;
    return this.client.get("/api/events", query);
  }
  /**
   * Iterate through all events that match the provided filters.
   *
   * Automatically requests subsequent pages until all available events
   * have been yielded.
   *
   * @param params - Filter and pagination options. `limit` controls page size.
   */
  async *listAll(params = {}) {
    const limit = params.limit ?? 50;
    let offset = params.offset ?? 0;
    let yielded = 0;
    while (true) {
      const page = await this.list({ ...params, limit, offset });
      if (page.events.length === 0) {
        return;
      }
      for (const event of page.events) {
        yield event;
        yielded += 1;
      }
      offset += page.events.length;
      if (yielded >= page.total) {
        return;
      }
    }
  }
  /**
   * Get a single event by ID.
   *
   * @param id - The event ID
   * @returns The event object
   * @throws {VeritixNotFoundError} If the event does not exist
   */
  async get(id) {
    const data = await this.client.get(`/api/events/${encodeURIComponent(id)}`);
    return data.event;
  }
  /**
   * Create a new event.
   *
   * Requires authentication as the event organizer.
   *
   * @param input - Event details
   * @returns The created event
   * @throws {VeritixAuthError} If not authenticated
   * @throws {VeritixValidationError} If input is invalid
   */
  async create(input) {
    const data = await this.client.post("/api/events", input);
    return data.event;
  }
  /**
   * Update an existing event.
   *
   * Only the event organizer can update their own events.
   * All fields are optional — only the provided fields are updated.
   *
   * @param id - The event ID
   * @param input - Fields to update
   * @returns The updated event
   * @throws {VeritixForbiddenError} If you are not the event organizer
   */
  async update(id, input) {
    const data = await this.client.patch(
      `/api/events/${encodeURIComponent(id)}`,
      input
    );
    return data.event;
  }
  /**
   * Cancel an event.
   *
   * Sets the event status to "Cancelled". Only the organizer can cancel.
   *
   * @param id - The event ID
   * @returns The cancelled event
   * @throws {VeritixForbiddenError} If you are not the event organizer
   */
  async cancel(id) {
    const data = await this.client.delete(
      `/api/events/${encodeURIComponent(id)}`
    );
    return data.event;
  }
};

// src/tickets.ts
var TicketsClient = class {
  /** @internal */
  constructor(client) {
    this.client = client;
  }
  /**
   * Purchase a ticket for an event.
   *
   * You must first send an STX transfer to the platform escrow address,
   * then submit the transaction ID here. The API verifies the on-chain
   * payment before issuing the ticket.
   *
   * If the payment is still pending on-chain, the response will include
   * `pending: true` and the ticket will be in "Pending" status.
   *
   * @param input - Event ID, transaction ID, and network
   * @returns The ticket (possibly in pending state)
   * @throws {VeritixAuthError} If not authenticated
   * @throws {VeritixNotFoundError} If the event does not exist
   * @throws {VeritixValidationError} If the event is not active or sold out
   * @throws {VeritixConflictError} If the txId was already used
   */
  async purchase(input) {
    return this.client.post("/api/tickets", input);
  }
  /**
   * List all tickets owned by the current user.
   *
   * Returns tickets sorted by purchase date (newest first), with
   * event details attached to each ticket.
   *
   * @returns Array of tickets with event metadata
   * @throws {VeritixAuthError} If not authenticated
   */
  async mine() {
    const data = await this.client.get("/api/tickets/me");
    return data.tickets;
  }
  /**
   * Get a single ticket by ID.
   *
   * Uses `GET /api/tickets/:id` when the API supports it. If that route is
   * unavailable, falls back to searching the authenticated user's tickets.
   *
   * @param id - The ticket ID
   * @returns The matching ticket
   * @throws {VeritixNotFoundError} If the ticket does not exist or is not owned by the current user
   */
  async get(id) {
    try {
      const data = await this.client.get(`/api/tickets/${encodeURIComponent(id)}`);
      return data.ticket;
    } catch (error) {
      if (!(error instanceof VeritixNotFoundError)) {
        throw error;
      }
    }
    const ticket = (await this.mine()).find((item) => item.id === id);
    if (!ticket) {
      throw new VeritixNotFoundError("Ticket not found");
    }
    return ticket;
  }
};

// src/organizer.ts
var OrganizerClient = class {
  /** @internal */
  constructor(client) {
    this.client = client;
  }
  /**
   * List all events created by the current user (organizer view).
   *
   * Each event includes a `revenue` field showing total earnings in STX.
   *
   * @returns Array of organizer events with revenue data
   * @throws {VeritixAuthError} If not authenticated
   */
  async events() {
    return this.client.get("/api/organizer/events");
  }
  /**
   * Get the attendee list for a specific event.
   *
   * Only the event organizer can view attendees.
   *
   * @param eventId - The event ID
   * @returns Event info and list of attendees with check-in status
   * @throws {VeritixAuthError} If not authenticated
   * @throws {VeritixForbiddenError} If you are not the event organizer
   * @throws {VeritixNotFoundError} If the event does not exist
   */
  async attendees(eventId) {
    return this.client.get(`/api/organizer/events/${encodeURIComponent(eventId)}/attendees`);
  }
  /**
   * Verify (check in) a ticket at the event door.
   *
   * Marks the ticket as "Used". Can only be done by the event organizer,
   * and only for tickets in "Valid" status.
   *
   * @param ticketId - The ticket ID to verify
   * @returns Verification result with ticket details
   * @throws {VeritixAuthError} If not authenticated
   * @throws {VeritixForbiddenError} If you are not the event organizer
   * @throws {VeritixNotFoundError} If the ticket does not exist
   * @throws {VeritixConflictError} If the ticket was already used
   */
  async verifyTicket(ticketId) {
    return this.client.post("/api/organizer/verify", {
      ticketId
    });
  }
  /**
   * Get the organizer's activity feed.
   *
   * Returns recent events, ticket purchases, and check-ins
   * sorted chronologically (newest first).
   *
   * @returns Array of activity items
   * @throws {VeritixAuthError} If not authenticated
   */
  async activity() {
    return this.client.get("/api/organizer/activity");
  }
};

// src/users.ts
var UsersClient = class {
  /** @internal */
  constructor(client) {
    this.client = client;
  }
  /**
   * Get the current user's profile.
   *
   * @returns The user profile, or `null` if not authenticated
   */
  async me() {
    const data = await this.client.get("/api/auth/me");
    return data.user;
  }
  /**
   * Update the current user's profile.
   *
   * All fields are optional — only the provided fields are updated.
   * Pass `null` to clear a field.
   *
   * @param input - Profile fields to update
   * @returns The updated user profile
   * @throws {VeritixAuthError} If not authenticated
   * @throws {VeritixValidationError} If input is invalid
   */
  async updateProfile(input) {
    const data = await this.client.patch("/api/users/me", input);
    return data.user;
  }
};

// src/client.ts
var VeritixClient = class {
  constructor(config) {
    if (!config.baseUrl) {
      throw new Error("VeritixClient requires a `baseUrl` option.");
    }
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/+$/, ""),
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1e3,
      timeout: config.timeout ?? 3e4,
      fetchFn: config.fetch ?? globalThis.fetch.bind(globalThis)
    };
  }
  // ─── Sub-clients (lazy-initialized) ──────────────────────────────────────
  /** Authentication operations (nonce, verify, session). */
  get auth() {
    if (!this._auth) this._auth = new AuthClient(this);
    return this._auth;
  }
  /** Event CRUD and listing. */
  get events() {
    if (!this._events) this._events = new EventsClient(this);
    return this._events;
  }
  /** Ticket purchasing and listing. */
  get tickets() {
    if (!this._tickets) this._tickets = new TicketsClient(this);
    return this._tickets;
  }
  /** Organizer dashboard operations. */
  get organizer() {
    if (!this._organizer) this._organizer = new OrganizerClient(this);
    return this._organizer;
  }
  /** User profile operations. */
  get users() {
    if (!this._users) this._users = new UsersClient(this);
    return this._users;
  }
  // ─── Token management ───────────────────────────────────────────────────
  /**
   * Update the JWT token used for authenticated requests.
   * Useful after a fresh login or token refresh.
   */
  setToken(token) {
    this.config.token = token;
  }
  /** Get the current base URL. */
  get baseUrl() {
    return this.config.baseUrl;
  }
  // ─── Internal HTTP methods (used by sub-clients) ────────────────────────
  /**
   * Make an authenticated GET request to the API.
   * @internal
   */
  async get(path, params) {
    const url = buildUrl(this.config.baseUrl, path, params);
    return this.request(url, { method: "GET" });
  }
  /**
   * Make an authenticated POST request to the API.
   * @internal
   */
  async post(path, body) {
    const url = buildUrl(this.config.baseUrl, path);
    return this.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== void 0 ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make an authenticated PATCH request to the API.
   * @internal
   */
  async patch(path, body) {
    const url = buildUrl(this.config.baseUrl, path);
    return this.request(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body !== void 0 ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make an authenticated DELETE request to the API.
   * @internal
   */
  async delete(path) {
    const url = buildUrl(this.config.baseUrl, path);
    return this.request(url, { method: "DELETE" });
  }
  // ─── Core request handling ──────────────────────────────────────────────
  async request(url, init) {
    const headers = new Headers(init.headers);
    if (this.config.token) {
      headers.set("Authorization", `Bearer ${this.config.token}`);
    }
    if (this.config.headers) {
      for (const [key, value] of Object.entries(this.config.headers)) {
        headers.set(key, value);
      }
    }
    let credentials = this.config.credentials;
    if (!credentials && !this.config.token && isBrowser()) {
      credentials = "include";
    }
    const requestInit = {
      ...init,
      headers,
      credentials
    };
    let response;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      response = await this.fetchWithTimeout(url, requestInit);
      if (!this.shouldRetry(response, attempt)) {
        break;
      }
      await this.delay(this.getRetryDelay(response, attempt));
    }
    if (!response) {
      throw new VeritixError("Request failed", 0, "REQUEST_FAILED");
    }
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    if (response.status === 204) {
      return void 0;
    }
    return await response.json();
  }
  async fetchWithTimeout(url, init) {
    const timeout = this.config.timeout;
    const controller = timeout > 0 ? new AbortController() : void 0;
    const requestInit = {
      ...init,
      signal: controller?.signal ?? init.signal
    };
    await this.config.onRequest?.(url, requestInit);
    let timeoutId;
    try {
      const fetchPromise = this.config.fetchFn(url, requestInit);
      const response = timeout > 0 ? await Promise.race([
        fetchPromise,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            controller?.abort();
            reject(
              new VeritixTimeoutError(`Request timed out after ${timeout}ms`, {
                timeout
              })
            );
          }, timeout);
        })
      ]) : await fetchPromise;
      await this.config.onResponse?.(url, response);
      return response;
    } catch (error) {
      if (error instanceof VeritixTimeoutError) {
        throw error;
      }
      if (isAbortError(error)) {
        throw new VeritixTimeoutError(`Request timed out after ${timeout}ms`, { timeout });
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
  shouldRetry(response, attempt) {
    return attempt < this.config.maxRetries && (response.status === 429 || response.status === 503);
  }
  getRetryDelay(response, attempt) {
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
      const delay = parseRetryAfter(retryAfter);
      if (delay !== void 0) {
        return delay;
      }
    }
    return this.config.retryDelay * 2 ** attempt;
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async handleErrorResponse(response) {
    let body = null;
    try {
      body = await response.json();
    } catch {
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
};
function parseRetryAfter(value) {
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1e3;
  }
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return void 0;
}
function isAbortError(error) {
  return error instanceof DOMException ? error.name === "AbortError" : error instanceof Error && error.name === "AbortError";
}

// src/stacks.ts
var ESCROW_ADDRESSES = {
  testnet: void 0,
  mainnet: void 0
};
function setEscrowAddresses(addresses) {
  if (addresses.testnet) ESCROW_ADDRESSES.testnet = addresses.testnet;
  if (addresses.mainnet) ESCROW_ADDRESSES.mainnet = addresses.mainnet;
}
function getEscrowAddress(network = "testnet") {
  const address = ESCROW_ADDRESSES[network];
  if (!address) {
    throw new Error(
      `No escrow address configured for ${network}. Call setEscrowAddresses() first or pass recipientAddress directly.`
    );
  }
  return address;
}
function buildTicketTransfer(options) {
  const {
    recipientAddress,
    amountStx,
    memo = "",
    network = "testnet"
  } = options;
  if (!recipientAddress) {
    throw new Error("recipientAddress is required");
  }
  const microStx = stxToMicroStx(amountStx);
  return {
    recipient: recipientAddress,
    amount: BigInt(microStx),
    memo,
    network,
    // AnchorMode.Any = 3 — avoids requiring an import from @stacks/transactions
    anchorMode: 3
  };
}
function buildSignInMessage(params) {
  const { address, nonce, issuedAt, domain = "veritix.app" } = params;
  return [
    `${domain} wants you to sign in with your Stacks account:`,
    address,
    "",
    "Sign this message to authenticate with Veritix.",
    "",
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join("\n");
}

export { AuthClient, EventsClient, OrganizerClient, TicketsClient, UsersClient, VeritixAuthError, VeritixClient, VeritixConflictError, VeritixError, VeritixForbiddenError, VeritixNotFoundError, VeritixRateLimitError, VeritixServiceError, VeritixTimeoutError, VeritixValidationError, buildSignInMessage, buildTicketTransfer, getEscrowAddress, microStxToStx, setEscrowAddresses, stxToMicroStx };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map