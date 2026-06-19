import type { VeritixClient } from "./client";
import type {
  Ticket,
  PurchaseTicketInput,
  PurchaseTicketResponse,
} from "./types";
import { VeritixNotFoundError } from "./errors";

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
export class TicketsClient {
  /** @internal */
  constructor(private readonly client: VeritixClient) {}

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
  async purchase(input: PurchaseTicketInput): Promise<PurchaseTicketResponse> {
    return this.client.post<PurchaseTicketResponse>("/api/tickets", input);
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
  async mine(): Promise<Ticket[]> {
    const data = await this.client.get<{ tickets: Ticket[] }>("/api/tickets/me");
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
  async get(id: string): Promise<Ticket> {
    try {
      const data = await this.client.get<{ ticket: Ticket }>(`/api/tickets/${encodeURIComponent(id)}`);
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
}
