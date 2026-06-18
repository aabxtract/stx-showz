import type { VeritixClient } from "./client";
import type {
  VeritixEvent,
  CreateEventInput,
  UpdateEventInput,
  ListEventsParams,
  ListEventsResponse,
} from "./types";

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
export class EventsClient {
  /** @internal */
  constructor(private readonly client: VeritixClient) {}

  /**
   * List events with optional filtering and pagination.
   *
   * @param params - Filter by category, status, organizer, search query, and pagination
   * @returns Paginated list of events with total count
   */
  async list(params: ListEventsParams = {}): Promise<ListEventsResponse> {
    const query: Record<string, string | number | undefined> = {};
    if (params.category) query.category = params.category;
    if (params.status) query.status = params.status;
    if (params.organizer) query.organizer = params.organizer;
    if (params.q) query.q = params.q;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.offset !== undefined) query.offset = params.offset;

    return this.client.get<ListEventsResponse>("/api/events", query);
  }

  /**
   * Get a single event by ID.
   *
   * @param id - The event ID
   * @returns The event object
   * @throws {VeritixNotFoundError} If the event does not exist
   */
  async get(id: string): Promise<VeritixEvent> {
    const data = await this.client.get<{ event: VeritixEvent }>(`/api/events/${encodeURIComponent(id)}`);
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
  async create(input: CreateEventInput): Promise<VeritixEvent> {
    const data = await this.client.post<{ event: VeritixEvent }>("/api/events", input);
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
  async update(id: string, input: UpdateEventInput): Promise<VeritixEvent> {
    const data = await this.client.patch<{ event: VeritixEvent }>(
      `/api/events/${encodeURIComponent(id)}`,
      input,
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
  async cancel(id: string): Promise<VeritixEvent> {
    const data = await this.client.delete<{ event: VeritixEvent }>(
      `/api/events/${encodeURIComponent(id)}`,
    );
    return data.event;
  }
}
