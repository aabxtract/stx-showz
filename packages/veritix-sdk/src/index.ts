/**
 * Veritix SDK — Official TypeScript SDK for the Veritix event ticketing platform.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { VeritixClient } from 'veritix-sdk';
 *
 * const veritix = new VeritixClient({
 *   baseUrl: 'https://your-veritix-instance.com',
 *   token: 'your-jwt-token',
 * });
 *
 * // List events
 * const { events } = await veritix.events.list({ category: 'Music' });
 *
 * // Purchase a ticket
 * const { ticket } = await veritix.tickets.purchase({
 *   eventId: events[0].id,
 *   txId: '0xabc...',
 *   network: 'testnet',
 * });
 * ```
 */

// ─── Core ────────────────────────────────────────────────────────────────────
export { VeritixClient } from "./client";

// ─── Sub-clients ─────────────────────────────────────────────────────────────
export { AuthClient } from "./auth";
export { EventsClient } from "./events";
export { TicketsClient } from "./tickets";
export { OrganizerClient } from "./organizer";
export { UsersClient } from "./users";

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
  VeritixError,
  VeritixAuthError,
  VeritixForbiddenError,
  VeritixNotFoundError,
  VeritixConflictError,
  VeritixRateLimitError,
  VeritixValidationError,
  VeritixServiceError,
  VeritixTimeoutError,
} from "./errors";

// ─── Stacks Helpers ──────────────────────────────────────────────────────────
export {
  buildTicketTransfer,
  buildSignInMessage,
  setEscrowAddresses,
  getEscrowAddress,
} from "./stacks";

// ─── Utilities ───────────────────────────────────────────────────────────────
export { stxToMicroStx, microStxToStx } from "./utils";

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Config
  VeritixConfig,
  // Events
  VeritixEvent,
  EventCategory,
  EventStatus,
  CreateEventInput,
  UpdateEventInput,
  ListEventsParams,
  ListEventsResponse,
  // Tickets
  Ticket,
  RawTicket,
  TicketStatus,
  PurchaseTicketInput,
  PurchaseTicketResponse,
  // Organizer
  OrganizerEvent,
  Attendee,
  VerifyTicketResult,
  Activity,
  // Users
  User,
  UpdateProfileInput,
  // Auth
  NonceResponse,
  VerifyAuthInput,
  AuthResponse,
  // Stacks
  StacksNetworkName,
  BuildTransferOptions,
} from "./types";
