import type { AppEvent } from "./types";
import { VeritixClient, VeritixError } from "veritix-sdk";
import type {
  EventCategory,
  PurchaseTicketResponse,
  RewardConfig,
  Disbursement,
  Ticket as SdkTicket,
  VeritixEvent,
  VerifyTicketResult,
} from "veritix-sdk";

const veritix = new VeritixClient({
  baseUrl: "/",
  fetch: (input, init) => {
    const method = init?.method?.toUpperCase() ?? "GET";
    return fetch(input, {
      ...init,
      cache: method === "GET" ? "no-store" : init?.cache,
    });
  },
});

const statusFromApi: Record<string, AppEvent["status"]> = {
  Active: "Active",
  SoldOut: "Sold Out",
  Cancelled: "Cancelled",
  Ended: "Ended",
};

const CURRENCY_LABELS: Record<string, string> = {
  stacks: "STX",
  bitcoin: "BTC",
};

export function toAppEvent(e: VeritixEvent): AppEvent {
  const network = e.network === "bitcoin" ? "bitcoin" : "stacks";
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category as AppEvent["category"],
    date: e.date,
    location: e.location,
    image: e.image,
    price: Number(e.price),
    network,
    currency: CURRENCY_LABELS[network],
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
  limit?: number;
  offset?: number;
} = {}): Promise<{ events: AppEvent[]; total: number; limit: number; offset: number }> {
  const data = await veritix.events.list({
    category: params.category && params.category !== "All" ? params.category : undefined,
    q: params.q,
    organizer: params.organizer,
    limit: params.limit,
    offset: params.offset,
  });
  return {
    events: data.events.map(toAppEvent),
    total: data.total,
    limit: data.limit,
    offset: data.offset,
  };
}

export async function fetchEvent(id: string): Promise<AppEvent> {
  return toAppEvent(await veritix.events.get(id));
}

export type ApiTicket = SdkTicket;

export async function fetchMyTickets(): Promise<ApiTicket[]> {
  return veritix.tickets.mine();
}

export async function purchaseTicket(input: {
  eventId: string;
  txId: string;
  network: "testnet" | "mainnet";
}): Promise<PurchaseTicketResponse> {
  return veritix.tickets.purchase(input);
}

export async function createEvent(input: {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  image: string;
  price: string;
  network: "stacks" | "bitcoin";
  ticketsTotal: number;
}): Promise<AppEvent> {
  const event = await veritix.events.create(input);
  return toAppEvent(event);
}

export async function verifyTicket(
  ticketId: string,
): Promise<VerifyTicketResult | { ok: false; error: string }> {
  try {
    return await veritix.organizer.verifyTicket(ticketId);
  } catch (error) {
    if (error instanceof VeritixError) {
      return { ok: false, error: error.message || "Verify failed" };
    }
    return { ok: false, error: "Verify failed" };
  }
}

// ─── Rewards ────────────────────────────────────────────────────────────────

export async function getRewardConfig(eventId: string): Promise<RewardConfig | null> {
  return veritix.rewards.getConfig(eventId);
}

export async function setRewardConfig(
  eventId: string,
  tokenPerCheckin: number,
): Promise<RewardConfig> {
  return veritix.rewards.setConfig(eventId, { tokenPerCheckin });
}

export async function disburseReward(
  eventId: string,
  attendeeAddress: string,
): Promise<{ disbursement: Disbursement; txId: string }> {
  return veritix.rewards.disburse({ eventId, attendeeAddress });
}

export async function disburseBatch(
  eventId: string,
): Promise<Disbursement[]> {
  return veritix.rewards.disburseBatch(eventId);
}

export async function fetchDisbursements(): Promise<Disbursement[]> {
  return veritix.rewards.list();
}

export async function fetchVTXBalance(address: string): Promise<number> {
  return veritix.rewards.balance(address);
}
