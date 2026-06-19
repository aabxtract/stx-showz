import { describe, it, expect, vi, beforeEach } from "vitest";
import { VeritixClient } from "../src/client";
import {
  VeritixAuthError,
  VeritixNotFoundError,
  VeritixValidationError,
  VeritixConflictError,
  VeritixRateLimitError,
  VeritixForbiddenError,
  VeritixServiceError,
  VeritixTimeoutError,
  VeritixError,
} from "../src/errors";
import {
  stxToMicroStx,
  microStxToStx,
  buildUrl,
} from "../src/utils";
import {
  buildTicketTransfer,
  buildSignInMessage,
  setEscrowAddresses,
  getEscrowAddress,
} from "../src/stacks";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockResponse(status: number, body: unknown, headers: HeadersInit = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `Status ${status}`,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  } as Response;
}

function mockFetch(status: number, body: unknown, headers: HeadersInit = {}): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue({
    ...mockResponse(status, body, headers),
  }) as unknown as typeof globalThis.fetch;
}

function createClient(fetchFn: typeof globalThis.fetch): VeritixClient {
  return new VeritixClient({
    baseUrl: "https://api.test.veritix.app",
    token: "test-jwt-token",
    fetch: fetchFn,
    maxRetries: 0,
  });
}

// ─── VeritixClient ───────────────────────────────────────────────────────────

describe("VeritixClient", () => {
  it("throws if baseUrl is not provided", () => {
    expect(() => new VeritixClient({ baseUrl: "" })).toThrow("baseUrl");
  });

  it("strips trailing slashes from baseUrl", () => {
    const client = new VeritixClient({
      baseUrl: "https://api.test.veritix.app///",
      fetch: mockFetch(200, {}),
    });
    expect(client.baseUrl).toBe("https://api.test.veritix.app");
  });

  it("exposes lazy sub-clients", () => {
    const client = createClient(mockFetch(200, {}));
    expect(client.auth).toBeDefined();
    expect(client.events).toBeDefined();
    expect(client.tickets).toBeDefined();
    expect(client.organizer).toBeDefined();
    expect(client.users).toBeDefined();
  });

  it("returns the same sub-client instance on repeated access", () => {
    const client = createClient(mockFetch(200, {}));
    const auth1 = client.auth;
    const auth2 = client.auth;
    expect(auth1).toBe(auth2);
  });

  it("allows updating the token", () => {
    const client = createClient(mockFetch(200, {}));
    client.setToken("new-token");
    // No throw — we can't directly inspect the private config, but
    // calling setToken should not error.
  });
});

// ─── Error Mapping ───────────────────────────────────────────────────────────

describe("Error mapping", () => {
  const errorCases: [number, string, new (...args: unknown[]) => VeritixError][] = [
    [400, "Invalid input", VeritixValidationError as new (...args: unknown[]) => VeritixError],
    [401, "Unauthorized", VeritixAuthError as new (...args: unknown[]) => VeritixError],
    [403, "Forbidden", VeritixForbiddenError as new (...args: unknown[]) => VeritixError],
    [404, "Not found", VeritixNotFoundError as new (...args: unknown[]) => VeritixError],
    [409, "Conflict", VeritixConflictError as new (...args: unknown[]) => VeritixError],
    [429, "Too many requests", VeritixRateLimitError as new (...args: unknown[]) => VeritixError],
    [503, "Service unavailable", VeritixServiceError as new (...args: unknown[]) => VeritixError],
    [500, "Server error", VeritixError],
  ];

  for (const [status, errorMsg, ErrorClass] of errorCases) {
    it(`maps HTTP ${status} to ${ErrorClass.name}`, async () => {
      const client = createClient(mockFetch(status, { error: errorMsg }));
      await expect(client.events.list()).rejects.toThrow(ErrorClass);
    });
  }

  it("includes the error message from the API response", async () => {
    const client = createClient(mockFetch(400, { error: "Price must be non-negative" }));
    try {
      await client.events.list();
    } catch (e) {
      expect(e).toBeInstanceOf(VeritixValidationError);
      expect((e as VeritixError).message).toBe("Price must be non-negative");
      expect((e as VeritixError).status).toBe(400);
    }
  });
});

// ─── Auth Client ─────────────────────────────────────────────────────────────

describe("AuthClient", () => {
  it("getNonce sends POST with address", async () => {
    const fetchFn = mockFetch(200, { nonce: "abc", message: "msg", issuedAt: "2026-01-01" });
    const client = createClient(fetchFn);

    const result = await client.auth.getNonce("SP1234");

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.veritix.app/api/auth/nonce");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ address: "SP1234" });
    expect(result.nonce).toBe("abc");
  });

  it("verify sends POST with auth data", async () => {
    const fetchFn = mockFetch(200, { user: { id: "1", address: "SP1234", name: null, avatarUrl: null } });
    const client = createClient(fetchFn);

    const result = await client.auth.verify({
      address: "SP1234",
      publicKey: "pk",
      signature: "sig",
      issuedAt: "2026-01-01",
    });

    expect(result.user.address).toBe("SP1234");
  });

  it("me returns user or null", async () => {
    const fetchFn = mockFetch(200, { user: null });
    const client = createClient(fetchFn);

    const result = await client.auth.me();
    expect(result).toBeNull();
  });

  it("logout calls POST", async () => {
    const fetchFn = mockFetch(200, { ok: true });
    const client = createClient(fetchFn);

    await client.auth.logout();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

// ─── Events Client ───────────────────────────────────────────────────────────

describe("EventsClient", () => {
  const sampleEvent = {
    id: "e1",
    title: "Test Event",
    description: "Desc",
    category: "Music",
    date: "2026-08-01T00:00:00Z",
    location: "Lagos",
    image: "https://img.test/1.jpg",
    price: "5.0",
    ticketsTotal: 100,
    ticketsSold: 10,
    ticketsLeft: 90,
    status: "Active",
    organizerId: "u1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("list sends GET with query params", async () => {
    const fetchFn = mockFetch(200, { events: [sampleEvent], total: 1, limit: 50, offset: 0 });
    const client = createClient(fetchFn);

    const result = await client.events.list({ category: "Music", q: "test", limit: 10 });

    const [url] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("category=Music");
    expect(url).toContain("q=test");
    expect(url).toContain("limit=10");
    expect(result.events).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("listAll auto-paginates through all events", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(200, {
        events: [{ ...sampleEvent, id: "e1" }],
        total: 3,
        limit: 2,
        offset: 0,
      }))
      .mockResolvedValueOnce(mockResponse(200, {
        events: [{ ...sampleEvent, id: "e2" }, { ...sampleEvent, id: "e3" }],
        total: 3,
        limit: 2,
        offset: 1,
      }));
    const client = createClient(fetchFn as unknown as typeof globalThis.fetch);

    const events = [];
    for await (const event of client.events.listAll({ category: "Music", limit: 2 })) {
      events.push(event);
    }

    expect(events.map((event) => event.id)).toEqual(["e1", "e2", "e3"]);
    const [secondUrl] = fetchFn.mock.calls[1] as [string];
    expect(secondUrl).toContain("offset=1");
  });

  it("get sends GET to /api/events/:id", async () => {
    const fetchFn = mockFetch(200, { event: sampleEvent });
    const client = createClient(fetchFn);

    const event = await client.events.get("e1");

    const [url] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe("https://api.test.veritix.app/api/events/e1");
    expect(event.id).toBe("e1");
  });

  it("create sends POST with body", async () => {
    const fetchFn = mockFetch(201, { event: sampleEvent });
    const client = createClient(fetchFn);

    const event = await client.events.create({
      title: "Test Event",
      description: "Desc",
      category: "Music",
      date: "2026-08-01T00:00:00Z",
      location: "Lagos",
      image: "https://img.test/1.jpg",
      price: "5.0",
      ticketsTotal: 100,
    });

    const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(event.title).toBe("Test Event");
  });

  it("update sends PATCH", async () => {
    const fetchFn = mockFetch(200, { event: { ...sampleEvent, title: "Updated" } });
    const client = createClient(fetchFn);

    const event = await client.events.update("e1", { title: "Updated" });

    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/events/e1");
    expect(init.method).toBe("PATCH");
    expect(event.title).toBe("Updated");
  });

  it("cancel sends DELETE", async () => {
    const fetchFn = mockFetch(200, { event: { ...sampleEvent, status: "Cancelled" } });
    const client = createClient(fetchFn);

    const event = await client.events.cancel("e1");

    const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(event.status).toBe("Cancelled");
  });
});

// ─── Tickets Client ──────────────────────────────────────────────────────────

describe("TicketsClient", () => {
  const sampleTicket = {
    id: "t1",
    eventId: "e1",
    eventTitle: "Test Event",
    eventDate: "2026-08-01T00:00:00Z",
    location: "Lagos",
    image: "https://img.test/1.jpg",
    eventStatus: "Active",
    txId: "0xabc",
    txStatus: "confirmed",
    amountStx: "5.0",
    network: "testnet",
    status: "Valid",
    usedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("purchase sends POST", async () => {
    const fetchFn = mockFetch(201, { ticket: { id: "t1", status: "Valid" }, pending: false });
    const client = createClient(fetchFn);

    const result = await client.tickets.purchase({
      eventId: "e1",
      txId: "0xabc",
      network: "testnet",
    });

    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.veritix.app/api/tickets");
    expect(init.method).toBe("POST");
    expect(result.ticket.id).toBe("t1");
  });

  it("mine sends GET", async () => {
    const fetchFn = mockFetch(200, { tickets: [{ id: "t1" }, { id: "t2" }] });
    const client = createClient(fetchFn);

    const tickets = await client.tickets.mine();

    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.veritix.app/api/tickets/me");
    expect(init.method).toBe("GET");
    expect(tickets).toHaveLength(2);
  });

  it("get fetches a single ticket when the direct endpoint is available", async () => {
    const fetchFn = mockFetch(200, { ticket: sampleTicket });
    const client = createClient(fetchFn);

    const ticket = await client.tickets.get("t1");

    const [url] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe("https://api.test.veritix.app/api/tickets/t1");
    expect(ticket.id).toBe("t1");
  });

  it("get falls back to the current user's tickets when the direct endpoint is unavailable", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(404, { error: "Not found" }))
      .mockResolvedValueOnce(mockResponse(200, { tickets: [sampleTicket] }));
    const client = createClient(fetchFn as unknown as typeof globalThis.fetch);

    const ticket = await client.tickets.get("t1");

    expect(ticket.id).toBe("t1");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const [fallbackUrl] = fetchFn.mock.calls[1] as [string];
    expect(fallbackUrl).toBe("https://api.test.veritix.app/api/tickets/me");
  });
});

// ─── Organizer Client ────────────────────────────────────────────────────────

describe("OrganizerClient", () => {
  it("events sends GET", async () => {
    const fetchFn = mockFetch(200, { events: [] });
    const client = createClient(fetchFn);

    const result = await client.organizer.events();
    expect(result.events).toEqual([]);
  });

  it("attendees sends GET with event ID", async () => {
    const fetchFn = mockFetch(200, { eventId: "e1", eventTitle: "Test", attendees: [] });
    const client = createClient(fetchFn);

    const result = await client.organizer.attendees("e1");

    const [url] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("/api/organizer/events/e1/attendees");
    expect(result.attendees).toEqual([]);
  });

  it("verifyTicket sends POST", async () => {
    const fetchFn = mockFetch(200, { ok: true, ticket: { id: "t1", status: "Used" } });
    const client = createClient(fetchFn);

    const result = await client.organizer.verifyTicket("t1");
    expect(result.ok).toBe(true);
  });

  it("activity sends GET", async () => {
    const fetchFn = mockFetch(200, { activity: [] });
    const client = createClient(fetchFn);

    const result = await client.organizer.activity();
    expect(result.activity).toEqual([]);
  });
});

// ─── Users Client ────────────────────────────────────────────────────────────

describe("UsersClient", () => {
  it("updateProfile sends PATCH", async () => {
    const fetchFn = mockFetch(200, { user: { id: "u1", address: "SP1", name: "Test", avatarUrl: null } });
    const client = createClient(fetchFn);

    const user = await client.users.updateProfile({ name: "Test" });

    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.veritix.app/api/users/me");
    expect(init.method).toBe("PATCH");
    expect(user.name).toBe("Test");
  });
});

// ─── Request Configuration ───────────────────────────────────────────────────

describe("Request configuration", () => {
  it("sends Authorization header when token is set", async () => {
    const fetchFn = mockFetch(200, { events: [], total: 0, limit: 50, offset: 0 });
    const client = createClient(fetchFn);

    await client.events.list();

    const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-jwt-token");
  });

  it("sends custom headers", async () => {
    const fetchFn = mockFetch(200, { events: [], total: 0, limit: 50, offset: 0 });
    const client = new VeritixClient({
      baseUrl: "https://api.test.veritix.app",
      headers: { "X-Custom": "value" },
      fetch: fetchFn,
    });

    await client.events.list();

    const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("X-Custom")).toBe("value");
  });

  it("retries transient responses with exponential backoff", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(503, { error: "Try again" }))
      .mockResolvedValueOnce(mockResponse(429, { error: "Slow down" }))
      .mockResolvedValueOnce(mockResponse(200, { events: [], total: 0, limit: 50, offset: 0 }));
    const client = new VeritixClient({
      baseUrl: "https://api.test.veritix.app",
      fetch: fetchFn as unknown as typeof globalThis.fetch,
      retryDelay: 1,
      maxRetries: 2,
    });

    const result = await client.events.list();

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(result.events).toEqual([]);
  });

  it("respects Retry-After when retrying", async () => {
    vi.useFakeTimers();
    try {
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(mockResponse(429, { error: "Slow down" }, { "Retry-After": "2" }))
        .mockResolvedValueOnce(mockResponse(200, { events: [], total: 0, limit: 50, offset: 0 }));
      const client = new VeritixClient({
        baseUrl: "https://api.test.veritix.app",
        fetch: fetchFn as unknown as typeof globalThis.fetch,
        retryDelay: 1,
        maxRetries: 1,
      });

      const promise = client.events.list();
      await vi.advanceTimersByTimeAsync(1999);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      await expect(promise).resolves.toEqual({ events: [], total: 0, limit: 50, offset: 0 });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws VeritixTimeoutError when a request times out", async () => {
    vi.useFakeTimers();
    try {
      const fetchFn = vi.fn(
        () => new Promise<Response>(() => undefined),
      ) as unknown as typeof globalThis.fetch;
      const client = new VeritixClient({
        baseUrl: "https://api.test.veritix.app",
        fetch: fetchFn,
        timeout: 100,
      });

      const promise = expect(client.events.list()).rejects.toThrow(VeritixTimeoutError);
      await vi.advanceTimersByTimeAsync(100);
      await promise;
    } finally {
      vi.useRealTimers();
    }
  });

  it("calls request and response interceptors for each attempt", async () => {
    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(503, { error: "Try again" }))
      .mockResolvedValueOnce(mockResponse(200, { events: [], total: 0, limit: 50, offset: 0 }));
    const client = new VeritixClient({
      baseUrl: "https://api.test.veritix.app",
      fetch: fetchFn as unknown as typeof globalThis.fetch,
      retryDelay: 0,
      maxRetries: 1,
      onRequest,
      onResponse,
    });

    await client.events.list();

    expect(onRequest).toHaveBeenCalledTimes(2);
    expect(onResponse).toHaveBeenCalledTimes(2);
    expect(onRequest.mock.calls[0][0]).toContain("/api/events");
    expect(onResponse.mock.calls[0][1].status).toBe(503);
  });
});

// ─── Utils ───────────────────────────────────────────────────────────────────

describe("Utils", () => {
  describe("buildUrl", () => {
    it("joins base and path", () => {
      expect(buildUrl("https://api.test", "/api/events")).toBe("https://api.test/api/events");
    });

    it("handles trailing/leading slashes", () => {
      expect(buildUrl("https://api.test/", "/api/events")).toBe("https://api.test/api/events");
    });

    it("appends query params", () => {
      const url = buildUrl("https://api.test", "/api/events", { category: "Music", limit: 10 });
      expect(url).toContain("category=Music");
      expect(url).toContain("limit=10");
    });

    it("omits undefined/null/empty params", () => {
      const url = buildUrl("https://api.test", "/api/events", {
        category: "Music",
        q: undefined,
        status: null,
        organizer: "",
      });
      expect(url).toContain("category=Music");
      expect(url).not.toContain("q=");
      expect(url).not.toContain("status=");
      expect(url).not.toContain("organizer=");
    });
  });

  describe("stxToMicroStx", () => {
    it("converts integer STX", () => {
      expect(stxToMicroStx(2)).toBe("2000000");
      expect(stxToMicroStx("5")).toBe("5000000");
    });

    it("converts decimal STX", () => {
      expect(stxToMicroStx("1.5")).toBe("1500000");
      expect(stxToMicroStx(0.001)).toBe("1000");
    });

    it("handles zero", () => {
      expect(stxToMicroStx(0)).toBe("0");
    });

    it("throws on invalid values", () => {
      expect(() => stxToMicroStx("abc")).toThrow("Invalid STX amount");
      expect(() => stxToMicroStx(-1)).toThrow("Invalid STX amount");
    });
  });

  describe("microStxToStx", () => {
    it("converts micro-STX to STX", () => {
      expect(microStxToStx("1500000")).toBe("1.5");
      expect(microStxToStx(2000000)).toBe("2");
    });
  });
});

// ─── Stacks Helpers ──────────────────────────────────────────────────────────

describe("Stacks helpers", () => {
  describe("buildTicketTransfer", () => {
    it("builds transfer options with correct values", () => {
      const result = buildTicketTransfer({
        recipientAddress: "ST1ABC",
        amountStx: "5.0",
        memo: "ticket-purchase",
        network: "testnet",
      });

      expect(result.recipient).toBe("ST1ABC");
      expect(result.amount).toBe(BigInt(5_000_000));
      expect(result.memo).toBe("ticket-purchase");
      expect(result.network).toBe("testnet");
      expect(result.anchorMode).toBe(3);
    });

    it("defaults network to testnet", () => {
      const result = buildTicketTransfer({
        recipientAddress: "ST1ABC",
        amountStx: "1",
      });
      expect(result.network).toBe("testnet");
    });

    it("defaults memo to empty string", () => {
      const result = buildTicketTransfer({
        recipientAddress: "ST1ABC",
        amountStx: "1",
      });
      expect(result.memo).toBe("");
    });

    it("throws if recipientAddress is missing", () => {
      expect(() =>
        buildTicketTransfer({ recipientAddress: "", amountStx: "1" }),
      ).toThrow("recipientAddress");
    });
  });

  describe("escrow addresses", () => {
    beforeEach(() => {
      // Reset by setting to known values
      setEscrowAddresses({ testnet: "", mainnet: "" });
    });

    it("throws when no address is configured", () => {
      // After resetting with empty strings, the address won't be set
      // because setEscrowAddresses skips falsy values
      expect(() => getEscrowAddress("mainnet")).toThrow("No escrow address");
    });

    it("returns configured address", () => {
      setEscrowAddresses({ testnet: "ST1TEST" });
      expect(getEscrowAddress("testnet")).toBe("ST1TEST");
    });
  });

  describe("buildSignInMessage", () => {
    it("builds correct SIWS message", () => {
      const message = buildSignInMessage({
        address: "SP1ABC",
        nonce: "nonce123",
        issuedAt: "2026-01-01T00:00:00Z",
      });

      expect(message).toContain("veritix.app wants you to sign in");
      expect(message).toContain("SP1ABC");
      expect(message).toContain("Nonce: nonce123");
      expect(message).toContain("Issued At: 2026-01-01T00:00:00Z");
    });

    it("uses custom domain", () => {
      const message = buildSignInMessage({
        address: "SP1ABC",
        nonce: "n",
        issuedAt: "2026-01-01",
        domain: "custom.app",
      });
      expect(message).toContain("custom.app wants you to sign in");
    });
  });
});
