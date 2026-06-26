// ─── Event Types ─────────────────────────────────────────────────────────────

/** Supported event categories on the Veritix platform. */
export type EventCategory =
  | "Music"
  | "Tech"
  | "Sports"
  | "Art"
  | "Conference"
  | "Workshop";

/** Event lifecycle status. */
export type EventStatus = "Active" | "SoldOut" | "Cancelled" | "Ended";

/** An event listed on the Veritix platform. */
export interface VeritixEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  image: string;
  /** Price as a decimal string in STX (e.g. "5.5"). */
  price: string;
  ticketsTotal: number;
  ticketsSold: number;
  ticketsLeft: number;
  status: EventStatus;
  organizerId: string;
  organizer?: { address: string; name: string | null };
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new event. */
export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  /** ISO 8601 datetime string. */
  date: string;
  location: string;
  /** URL to an event image. */
  image: string;
  /** Ticket price in STX (as string or number). */
  price: string | number;
  /** Blockchain network: "stacks" or "bitcoin". */
  network: "stacks" | "bitcoin";
  /** Total number of tickets available. */
  ticketsTotal: number;
}

/** Input for updating an existing event. */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: EventCategory;
  date?: string;
  location?: string;
  image?: string;
  network?: "stacks" | "bitcoin";
  ticketsTotal?: number;
}

/** Parameters for filtering / paginating events. */
export interface ListEventsParams {
  category?: EventCategory | string;
  status?: EventStatus | string;
  organizer?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

/** Paginated list of events. */
export interface ListEventsResponse {
  events: VeritixEvent[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Ticket Types ────────────────────────────────────────────────────────────

/** Ticket lifecycle status. */
export type TicketStatus = "Pending" | "Valid" | "Used" | "Cancelled";

/** A ticket owned by a user. */
export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  image: string;
  eventStatus: string;
  txId: string;
  txStatus: string;
  /** Amount paid in STX as a decimal string. */
  amountStx: string;
  network: string;
  status: TicketStatus;
  usedAt: string | null;
  createdAt: string;
}

/** Raw ticket as returned from the purchase endpoint. */
export interface RawTicket {
  id: string;
  eventId: string;
  ownerId: string;
  txId: string;
  txStatus: string;
  amountStx: string;
  paidTo: string;
  network: string;
  status: TicketStatus;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Input for purchasing a ticket. */
export interface PurchaseTicketInput {
  eventId: string;
  /** The Stacks transaction ID of the STX transfer. */
  txId: string;
  /** Network the transaction was broadcast on. */
  network?: "testnet" | "mainnet";
}

/** Response from a ticket purchase. */
export interface PurchaseTicketResponse {
  ticket: RawTicket;
  pending?: boolean;
}

// ─── Organizer Types ─────────────────────────────────────────────────────────

/** An event in the organizer's dashboard (includes revenue). */
export interface OrganizerEvent extends VeritixEvent {
  /** Total revenue as a decimal string in STX. */
  revenue: string;
}

/** An attendee for an organizer's event. */
export interface Attendee {
  wallet: string;
  ticketId: string;
  purchasedAt: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

/** Result of verifying a ticket at the door. */
export interface VerifyTicketResult {
  ok: boolean;
  ticket?: {
    id: string;
    status: string;
    usedAt: string | null;
    eventTitle: string;
    ownerAddress: string;
  };
  error?: string;
  usedAt?: string;
}

/** An item in the organizer's activity feed. */
export interface Activity {
  id: string;
  type: "purchase" | "create" | "verify" | "withdraw";
  label: string;
  timestamp: string;
}

// ─── User Types ──────────────────────────────────────────────────────────────

/** A user profile on Veritix. */
export interface User {
  id: string;
  address: string;
  name: string | null;
  bio?: string | null;
  avatarUrl: string | null;
}

/** Input for updating the current user's profile. */
export interface UpdateProfileInput {
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

/** Response from the nonce endpoint. */
export interface NonceResponse {
  nonce: string;
  message: string;
  issuedAt: string;
}

/** Input for verifying a signed authentication message. */
export interface VerifyAuthInput {
  address: string;
  publicKey: string;
  signature: string;
  issuedAt: string;
}

/** Response after successful authentication. */
export interface AuthResponse {
  user: User;
}

// ─── Client Config ───────────────────────────────────────────────────────────

/** Configuration options for the Veritix SDK client. */
export interface VeritixConfig {
  /**
   * Base URL of the Veritix API (e.g. "https://veritix.app").
   * No trailing slash.
   */
  baseUrl: string;

  /**
   * JWT session token for authenticated requests.
   * When set, requests include an `Authorization: Bearer <token>` header.
   * In browser environments you can omit this to rely on cookie-based auth.
   */
  token?: string;

  /**
   * Fetch `credentials` option.
   * Set to `"include"` for cookie-based browser auth (default when no token is provided in browser).
   * Defaults to `"same-origin"`.
   */
  credentials?: RequestCredentials;

  /**
   * Custom headers to attach to every request.
   */
  headers?: Record<string, string>;

  /**
   * Maximum number of retries for transient HTTP responses (429, 503).
   * Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Base retry delay in milliseconds. Exponential backoff is applied per retry.
   * Defaults to 1000.
   */
  retryDelay?: number;

  /**
   * Request timeout in milliseconds.
   * Defaults to 30000. Set to 0 to disable SDK-managed timeouts.
   */
  timeout?: number;

  /**
   * Optional hook invoked before each request attempt.
   * Useful for logging, analytics, or mutating request init before fetch.
   */
  onRequest?: (url: string, init: RequestInit) => void | Promise<void>;

  /**
   * Optional hook invoked after each response is received.
   */
  onResponse?: (url: string, response: Response) => void | Promise<void>;

  /**
   * Optional custom `fetch` implementation.
   * Useful for testing or environments without a global `fetch`.
   */
  fetch?: typeof globalThis.fetch;
}

// ─── Stacks Types ────────────────────────────────────────────────────────────

/** Network selection for Stacks blockchain operations. */
export type StacksNetworkName = "testnet" | "mainnet";

/** Options for building a ticket purchase STX transfer transaction. */
export interface BuildTransferOptions {
  /** Recipient address (typically the platform escrow wallet). */
  recipientAddress: string;
  /** Amount in STX (not micro-STX). Will be converted internally. */
  amountStx: string | number;
  /** Optional memo to attach to the transaction (max 34 bytes). */
  memo?: string;
  /** Network to broadcast on. Defaults to `"testnet"`. */
  network?: StacksNetworkName;
}
