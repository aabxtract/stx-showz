export type EventCategory =
  | "Music"
  | "Tech"
  | "Sports"
  | "Art"
  | "Conference"
  | "Workshop";

export type Network = "stacks" | "bitcoin";

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO
  location: string;
  image: string;
  price: number;
  network: Network;
  currency: string;
  ticketsTotal: number;
  ticketsLeft: number;
  organizer: string; // wallet address
  status?: "Active" | "Sold Out" | "Cancelled" | "Ended";
}

export type TicketStatus = "Valid" | "Used" | "Cancelled";

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  location: string;
  owner: string;
  status: TicketStatus;
}

export interface Attendee {
  wallet: string;
  ticketId: string;
  purchasedAt: string;
  checkedIn: boolean;
}

export interface OrganizerEvent extends AppEvent {
  ticketsSold: number;
  revenue: number;
  attendees: Attendee[];
}

export interface Activity {
  id: string;
  type: "purchase" | "create" | "verify" | "withdraw";
  label: string;
  timestamp: string;
}
