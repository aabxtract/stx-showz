/** Supported event categories on the Veritix platform. */
type EventCategory = "Music" | "Tech" | "Sports" | "Art" | "Conference" | "Workshop";
/** Event lifecycle status. */
type EventStatus = "Active" | "SoldOut" | "Cancelled" | "Ended";
/** An event listed on the Veritix platform. */
interface VeritixEvent {
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
    organizer?: {
        address: string;
        name: string | null;
    };
    createdAt: string;
    updatedAt: string;
}
/** Input for creating a new event. */
interface CreateEventInput {
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
    /** Total number of tickets available. */
    ticketsTotal: number;
}
/** Input for updating an existing event. */
interface UpdateEventInput {
    title?: string;
    description?: string;
    category?: EventCategory;
    date?: string;
    location?: string;
    image?: string;
    ticketsTotal?: number;
}
/** Parameters for filtering / paginating events. */
interface ListEventsParams {
    category?: EventCategory | string;
    status?: EventStatus | string;
    organizer?: string;
    q?: string;
    limit?: number;
    offset?: number;
}
/** Paginated list of events. */
interface ListEventsResponse {
    events: VeritixEvent[];
    total: number;
    limit: number;
    offset: number;
}
/** Ticket lifecycle status. */
type TicketStatus = "Pending" | "Valid" | "Used" | "Cancelled";
/** A ticket owned by a user. */
interface Ticket {
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
interface RawTicket {
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
interface PurchaseTicketInput {
    eventId: string;
    /** The Stacks transaction ID of the STX transfer. */
    txId: string;
    /** Network the transaction was broadcast on. */
    network?: "testnet" | "mainnet";
}
/** Response from a ticket purchase. */
interface PurchaseTicketResponse {
    ticket: RawTicket;
    pending?: boolean;
}
/** An event in the organizer's dashboard (includes revenue). */
interface OrganizerEvent extends VeritixEvent {
    /** Total revenue as a decimal string in STX. */
    revenue: string;
}
/** An attendee for an organizer's event. */
interface Attendee {
    wallet: string;
    ticketId: string;
    purchasedAt: string;
    checkedIn: boolean;
    checkedInAt: string | null;
}
/** Result of verifying a ticket at the door. */
interface VerifyTicketResult {
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
interface Activity {
    id: string;
    type: "purchase" | "create" | "verify" | "withdraw";
    label: string;
    timestamp: string;
}
/** A user profile on Veritix. */
interface User {
    id: string;
    address: string;
    name: string | null;
    bio?: string | null;
    avatarUrl: string | null;
}
/** Input for updating the current user's profile. */
interface UpdateProfileInput {
    name?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
}
/** Response from the nonce endpoint. */
interface NonceResponse {
    nonce: string;
    message: string;
    issuedAt: string;
}
/** Input for verifying a signed authentication message. */
interface VerifyAuthInput {
    address: string;
    publicKey: string;
    signature: string;
    issuedAt: string;
}
/** Response after successful authentication. */
interface AuthResponse {
    user: User;
}
/** Configuration options for the Veritix SDK client. */
interface VeritixConfig {
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
     * Optional custom `fetch` implementation.
     * Useful for testing or environments without a global `fetch`.
     */
    fetch?: typeof globalThis.fetch;
}
/** Network selection for Stacks blockchain operations. */
type StacksNetworkName = "testnet" | "mainnet";
/** Options for building a ticket purchase STX transfer transaction. */
interface BuildTransferOptions {
    /** Recipient address (typically the platform escrow wallet). */
    recipientAddress: string;
    /** Amount in STX (not micro-STX). Will be converted internally. */
    amountStx: string | number;
    /** Optional memo to attach to the transaction (max 34 bytes). */
    memo?: string;
    /** Network to broadcast on. Defaults to `"testnet"`. */
    network?: StacksNetworkName;
}

/**
 * Authentication operations for the Veritix API.
 *
 * Implements the Sign-In with Stacks (SIWS) flow:
 * 1. Request a nonce for an address
 * 2. Sign the message with the user's wallet
 * 3. Verify the signature to establish a session
 *
 * @example
 * ```typescript
 * // Step 1: Get nonce
 * const { nonce, message, issuedAt } = await veritix.auth.getNonce('SP1234...');
 *
 * // Step 2: User signs `message` with their Stacks wallet (outside the SDK)
 *
 * // Step 3: Verify signature
 * const { user } = await veritix.auth.verify({
 *   address: 'SP1234...',
 *   publicKey: '...',
 *   signature: '...',
 *   issuedAt,
 * });
 * ```
 */
declare class AuthClient {
    private readonly client;
    /** @internal */
    constructor(client: VeritixClient);
    /**
     * Request an authentication nonce for a Stacks address.
     *
     * The response includes a `message` string that the user must sign
     * with their wallet to authenticate.
     *
     * @param address - The Stacks wallet address (e.g. "SP1ABC...")
     * @returns Nonce, message to sign, and timestamp
     */
    getNonce(address: string): Promise<NonceResponse>;
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
    verify(input: VerifyAuthInput): Promise<AuthResponse>;
    /**
     * Get the currently authenticated user, or `null` if not logged in.
     */
    me(): Promise<User | null>;
    /**
     * Log out and clear the session.
     */
    logout(): Promise<void>;
}

/**
 * Event management operations.
 *
 * Browse, create, update, and cancel events on the Veritix platform.
 *
 * @example
 * ```typescript
 * // List upcoming music events
 * const { events, total } = await veritix.events.list({
 *   category: 'Music',
 *   limit: 10,
 * });
 *
 * // Get a single event
 * const event = await veritix.events.get('event-id');
 *
 * // Create an event (requires authentication)
 * const newEvent = await veritix.events.create({
 *   title: 'Summer Festival',
 *   description: 'Annual summer music festival',
 *   category: 'Music',
 *   date: '2026-08-01T18:00:00Z',
 *   location: 'Lagos, Nigeria',
 *   image: 'https://example.com/poster.jpg',
 *   price: '5.0',
 *   ticketsTotal: 500,
 * });
 * ```
 */
declare class EventsClient {
    private readonly client;
    /** @internal */
    constructor(client: VeritixClient);
    /**
     * List events with optional filtering and pagination.
     *
     * @param params - Filter by category, status, organizer, search query, and pagination
     * @returns Paginated list of events with total count
     */
    list(params?: ListEventsParams): Promise<ListEventsResponse>;
    /**
     * Get a single event by ID.
     *
     * @param id - The event ID
     * @returns The event object
     * @throws {VeritixNotFoundError} If the event does not exist
     */
    get(id: string): Promise<VeritixEvent>;
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
    create(input: CreateEventInput): Promise<VeritixEvent>;
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
    update(id: string, input: UpdateEventInput): Promise<VeritixEvent>;
    /**
     * Cancel an event.
     *
     * Sets the event status to "Cancelled". Only the organizer can cancel.
     *
     * @param id - The event ID
     * @returns The cancelled event
     * @throws {VeritixForbiddenError} If you are not the event organizer
     */
    cancel(id: string): Promise<VeritixEvent>;
}

/**
 * Ticket operations — purchasing and viewing owned tickets.
 *
 * @example
 * ```typescript
 * // Purchase a ticket after sending an STX transfer
 * const { ticket, pending } = await veritix.tickets.purchase({
 *   eventId: 'event-123',
 *   txId: '0xabc123...',
 *   network: 'testnet',
 * });
 *
 * if (pending) {
 *   console.log('Payment is being confirmed...');
 * } else {
 *   console.log('Ticket confirmed!', ticket.id);
 * }
 *
 * // List all my tickets
 * const tickets = await veritix.tickets.mine();
 * ```
 */
declare class TicketsClient {
    private readonly client;
    /** @internal */
    constructor(client: VeritixClient);
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
    purchase(input: PurchaseTicketInput): Promise<PurchaseTicketResponse>;
    /**
     * List all tickets owned by the current user.
     *
     * Returns tickets sorted by purchase date (newest first), with
     * event details attached to each ticket.
     *
     * @returns Array of tickets with event metadata
     * @throws {VeritixAuthError} If not authenticated
     */
    mine(): Promise<Ticket[]>;
}

/**
 * Organizer dashboard operations.
 *
 * Manage your events, view attendees, verify tickets at the door,
 * and review your activity feed.
 *
 * @example
 * ```typescript
 * // List my organized events with revenue
 * const { events } = await veritix.organizer.events();
 *
 * // Get attendee list for an event
 * const { attendees } = await veritix.organizer.attendees('event-id');
 *
 * // Verify a ticket at the door
 * const result = await veritix.organizer.verifyTicket('ticket-id');
 * if (result.ok) {
 *   console.log('Ticket verified for', result.ticket?.ownerAddress);
 * }
 * ```
 */
declare class OrganizerClient {
    private readonly client;
    /** @internal */
    constructor(client: VeritixClient);
    /**
     * List all events created by the current user (organizer view).
     *
     * Each event includes a `revenue` field showing total earnings in STX.
     *
     * @returns Array of organizer events with revenue data
     * @throws {VeritixAuthError} If not authenticated
     */
    events(): Promise<{
        events: OrganizerEvent[];
    }>;
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
    attendees(eventId: string): Promise<{
        eventId: string;
        eventTitle: string;
        attendees: Attendee[];
    }>;
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
    verifyTicket(ticketId: string): Promise<VerifyTicketResult>;
    /**
     * Get the organizer's activity feed.
     *
     * Returns recent events, ticket purchases, and check-ins
     * sorted chronologically (newest first).
     *
     * @returns Array of activity items
     * @throws {VeritixAuthError} If not authenticated
     */
    activity(): Promise<{
        activity: Activity[];
    }>;
}

/**
 * User profile operations.
 *
 * @example
 * ```typescript
 * // Update your profile
 * const user = await veritix.users.updateProfile({
 *   name: 'Anuoluwapo',
 *   bio: 'Event organizer & Stacks builder',
 * });
 *
 * // Get your profile
 * const me = await veritix.users.me();
 * ```
 */
declare class UsersClient {
    private readonly client;
    /** @internal */
    constructor(client: VeritixClient);
    /**
     * Get the current user's profile.
     *
     * @returns The user profile, or `null` if not authenticated
     */
    me(): Promise<User | null>;
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
    updateProfile(input: UpdateProfileInput): Promise<User>;
}

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
declare class VeritixClient {
    private readonly config;
    private _auth?;
    private _events?;
    private _tickets?;
    private _organizer?;
    private _users?;
    constructor(config: VeritixConfig);
    /** Authentication operations (nonce, verify, session). */
    get auth(): AuthClient;
    /** Event CRUD and listing. */
    get events(): EventsClient;
    /** Ticket purchasing and listing. */
    get tickets(): TicketsClient;
    /** Organizer dashboard operations. */
    get organizer(): OrganizerClient;
    /** User profile operations. */
    get users(): UsersClient;
    /**
     * Update the JWT token used for authenticated requests.
     * Useful after a fresh login or token refresh.
     */
    setToken(token: string | undefined): void;
    /** Get the current base URL. */
    get baseUrl(): string;
    /**
     * Make an authenticated GET request to the API.
     * @internal
     */
    get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T>;
    /**
     * Make an authenticated POST request to the API.
     * @internal
     */
    post<T>(path: string, body?: unknown): Promise<T>;
    /**
     * Make an authenticated PATCH request to the API.
     * @internal
     */
    patch<T>(path: string, body?: unknown): Promise<T>;
    /**
     * Make an authenticated DELETE request to the API.
     * @internal
     */
    delete<T>(path: string): Promise<T>;
    private request;
    private handleErrorResponse;
}

/**
 * Base error class for all Veritix SDK errors.
 * Provides HTTP status, a machine-readable code, and optional details.
 */
declare class VeritixError extends Error {
    /** HTTP status code from the API response. */
    readonly status: number;
    /** Machine-readable error code. */
    readonly code: string;
    /** Additional details (e.g. validation issues). */
    readonly details?: unknown;
    constructor(message: string, status: number, code?: string, details?: unknown);
}
/**
 * Thrown when the request is not authenticated (HTTP 401).
 */
declare class VeritixAuthError extends VeritixError {
    constructor(message?: string, details?: unknown);
}
/**
 * Thrown when the user lacks permission for the action (HTTP 403).
 */
declare class VeritixForbiddenError extends VeritixError {
    constructor(message?: string, details?: unknown);
}
/**
 * Thrown when the requested resource is not found (HTTP 404).
 */
declare class VeritixNotFoundError extends VeritixError {
    constructor(message?: string, details?: unknown);
}
/**
 * Thrown when a conflict occurs (HTTP 409), e.g. duplicate ticket purchase.
 */
declare class VeritixConflictError extends VeritixError {
    constructor(message?: string, details?: unknown);
}
/**
 * Thrown when the rate limit is exceeded (HTTP 429).
 */
declare class VeritixRateLimitError extends VeritixError {
    constructor(message?: string, details?: unknown);
}
/**
 * Thrown when the server returns a validation error (HTTP 400).
 */
declare class VeritixValidationError extends VeritixError {
    constructor(message?: string, details?: unknown);
}
/**
 * Thrown when the server is temporarily unavailable (HTTP 503).
 */
declare class VeritixServiceError extends VeritixError {
    constructor(message?: string, details?: unknown);
}

/**
 * Configure the escrow addresses for the Veritix platform.
 *
 * Call this once at startup if you know your platform's escrow addresses.
 *
 * @param addresses - Map of network name to escrow wallet address
 *
 * @example
 * ```typescript
 * import { setEscrowAddresses } from 'veritix-sdk';
 *
 * setEscrowAddresses({
 *   testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   mainnet: 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD7R',
 * });
 * ```
 */
declare function setEscrowAddresses(addresses: Partial<Record<StacksNetworkName, string>>): void;
/**
 * Get the configured escrow address for a given network.
 *
 * @param network - "testnet" or "mainnet"
 * @returns The escrow address
 * @throws If no escrow address is configured for the network
 */
declare function getEscrowAddress(network?: StacksNetworkName): string;
/**
 * Build the transaction options for an STX token transfer to purchase a ticket.
 *
 * Returns an object compatible with `@stacks/transactions`'s
 * `makeSTXTokenTransfer()` — you just need to add your `senderKey`.
 *
 * @param options - Transfer parameters
 * @returns Transaction options object ready for `makeSTXTokenTransfer()`
 *
 * @example
 * ```typescript
 * import { buildTicketTransfer } from 'veritix-sdk';
 * import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';
 *
 * const txOptions = buildTicketTransfer({
 *   recipientAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   amountStx: '5.0',
 *   memo: 'event-abc123',
 *   network: 'testnet',
 * });
 *
 * const tx = await makeSTXTokenTransfer({
 *   ...txOptions,
 *   senderKey: 'your-private-key',
 * });
 *
 * const result = await broadcastTransaction(tx);
 * console.log('Transaction ID:', result.txid);
 * ```
 */
declare function buildTicketTransfer(options: BuildTransferOptions): {
    recipient: string;
    amount: bigint;
    memo: string;
    network: StacksNetworkName;
    anchorMode: number;
};
/**
 * Helper to construct a SIWS (Sign-In with Stacks) message.
 *
 * This replicates the message format used by the Veritix server,
 * useful for client-side message construction before signing.
 *
 * @param params - Address, nonce, issuedAt, and optional domain
 * @returns The message string to sign
 */
declare function buildSignInMessage(params: {
    address: string;
    nonce: string;
    issuedAt: string;
    domain?: string;
}): string;

/**
 * Convert STX (as a number or string) to micro-STX (bigint-safe integer string).
 * 1 STX = 1,000,000 micro-STX.
 *
 * @example
 * stxToMicroStx("1.5") // "1500000"
 * stxToMicroStx(2)      // "2000000"
 */
declare function stxToMicroStx(stx: string | number): string;
/**
 * Convert micro-STX to STX as a string.
 */
declare function microStxToStx(microStx: string | number): string;

export { type Activity, type Attendee, AuthClient, type AuthResponse, type BuildTransferOptions, type CreateEventInput, type EventCategory, type EventStatus, EventsClient, type ListEventsParams, type ListEventsResponse, type NonceResponse, OrganizerClient, type OrganizerEvent, type PurchaseTicketInput, type PurchaseTicketResponse, type RawTicket, type StacksNetworkName, type Ticket, type TicketStatus, TicketsClient, type UpdateEventInput, type UpdateProfileInput, type User, UsersClient, type VerifyAuthInput, type VerifyTicketResult, VeritixAuthError, VeritixClient, type VeritixConfig, VeritixConflictError, VeritixError, type VeritixEvent, VeritixForbiddenError, VeritixNotFoundError, VeritixRateLimitError, VeritixServiceError, VeritixValidationError, buildSignInMessage, buildTicketTransfer, getEscrowAddress, microStxToStx, setEscrowAddresses, stxToMicroStx };
