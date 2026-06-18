import type { VeritixClient } from "./client";
import type {
  OrganizerEvent,
  Attendee,
  VerifyTicketResult,
  Activity,
} from "./types";

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
export class OrganizerClient {
  /** @internal */
  constructor(private readonly client: VeritixClient) {}

  /**
   * List all events created by the current user (organizer view).
   *
   * Each event includes a `revenue` field showing total earnings in STX.
   *
   * @returns Array of organizer events with revenue data
   * @throws {VeritixAuthError} If not authenticated
   */
  async events(): Promise<{ events: OrganizerEvent[] }> {
    return this.client.get<{ events: OrganizerEvent[] }>("/api/organizer/events");
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
  async attendees(
    eventId: string,
  ): Promise<{ eventId: string; eventTitle: string; attendees: Attendee[] }> {
    return this.client.get<{
      eventId: string;
      eventTitle: string;
      attendees: Attendee[];
    }>(`/api/organizer/events/${encodeURIComponent(eventId)}/attendees`);
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
  async verifyTicket(ticketId: string): Promise<VerifyTicketResult> {
    return this.client.post<VerifyTicketResult>("/api/organizer/verify", {
      ticketId,
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
  async activity(): Promise<{ activity: Activity[] }> {
    return this.client.get<{ activity: Activity[] }>("/api/organizer/activity");
  }
}
