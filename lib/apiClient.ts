import type { AppEvent } from "./types";

interface ApiEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image: string;
  price: string;
  ticketsTotal: number;
  ticketsSold: number;
  ticketsLeft: number;
  status: string;
  organizerId: string;
  organizer?: { address: string; name: string | null };
}

const statusFromApi: Record<string, AppEvent["status"]> = {
  Active: "Active",
  SoldOut: "Sold Out",
  Cancelled: "Cancelled",
  Ended: "Ended",
};

export function toAppEvent(e: ApiEvent): AppEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category as AppEvent["category"],
    date: e.date,
    location: e.location,
    image: e.image,
    price: Number(e.price),
    ticketsTotal: e.ticketsTotal,
    ticketsLeft: e.ticketsLeft,
    organizer: e.organizer?.address ?? e.organizerId,
    status: statusFromApi[e.status] ?? "Active",
  };
}

export async function fetchEvents(params: {
  category?: string;
  q?: string;
  organizer?: string;
} = {}): Promise<AppEvent[]> {
  const search = new URLSearchParams();
  if (params.category && params.category !== "All") search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.organizer) search.set("organizer", params.organizer);
  const qs = search.toString();
  const res = await fetch(`/api/events${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  const data = (await res.json()) as { events: ApiEvent[] };
  return data.events.map(toAppEvent);
}

export async function fetchEvent(id: string): Promise<AppEvent> {
  const res = await fetch(`/api/events/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Event not found");
  const data = (await res.json()) as { event: ApiEvent };
  return toAppEvent(data.event);
}

export interface ApiTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  image: string;
  eventStatus: string;
  txId: string;
  txStatus: string;
  amountStx: string;
  network: string;
  status: "Pending" | "Valid" | "Used" | "Cancelled";
  usedAt: string | null;
  createdAt: string;
}

export async function fetchMyTickets(): Promise<ApiTicket[]> {
  const res = await fetch(`/api/tickets/me`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load tickets");
  const data = (await res.json()) as { tickets: ApiTicket[] };
  return data.tickets;
}

export async function purchaseTicket(input: {
  eventId: string;
  txId: string;
  network: "testnet" | "mainnet";
}) {
  const res = await fetch(`/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Purchase failed");
  return data;
}

export async function createEvent(input: {
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image: string;
  price: string;
  ticketsTotal: number;
}): Promise<AppEvent> {
  const res = await fetch(`/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Create failed");
  return toAppEvent((data as { event: ApiEvent }).event);
}

export async function verifyTicket(ticketId: string) {
  const res = await fetch(`/api/organizer/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: (data as { error?: string }).error || "Verify failed" };
  }
  return { ok: true as const, ...(data as Record<string, unknown>) };
}
