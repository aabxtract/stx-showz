/**
 * End-to-end smoke test against a running dev server.
 *
 * Prerequisites:
 *   - DEV_AUTH_BYPASS="true" and DEV_PAYMENT_BYPASS="true" in .env
 *   - Postgres running and `prisma migrate dev` applied
 *   - `npm run dev` running on http://localhost:3000
 *
 * Run with: npm run test:smoke
 */
import assert from "node:assert/strict";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";

interface Cookies {
  jar: Map<string, string>;
  header(): string;
  absorb(res: Response): void;
}

function makeJar(): Cookies {
  const jar = new Map<string, string>();
  return {
    jar,
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    absorb(res: Response) {
      const raw = res.headers.get("set-cookie");
      if (!raw) return;
      for (const piece of raw.split(/,(?=[^;]+=[^;]+)/)) {
        const [pair] = piece.split(";");
        const eq = pair.indexOf("=");
        if (eq < 0) continue;
        jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    },
  };
}

async function req(
  cookies: Cookies,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies.header(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  cookies.absorb(res);
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  return { status: res.status, data };
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

let passed = 0;
let failed = 0;
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(e as Error).stack || (e as Error).message}`);
    failed++;
  }
}

async function main() {
  console.log(`Smoke test against ${BASE}\n`);

  // Random test addresses
  const organizerAddr = `ST${randHex(38).toUpperCase()}`;
  const buyerAddr = `ST${randHex(38).toUpperCase()}`;

  const organizer = makeJar();
  const buyer = makeJar();

  console.log("Server reachable");
  await step("GET /api/events returns 200", async () => {
    const r = await req(organizer, "GET", "/api/events");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray((r.data as { events: unknown[] }).events));
  });

  console.log("\nAuth (DEV_AUTH_BYPASS)");
  let organizerUser: { id: string; address: string } | undefined;
  let buyerUser: { id: string; address: string } | undefined;

  await step("organizer signs in", async () => {
    const nonce = await req(organizer, "POST", "/api/auth/nonce", { address: organizerAddr });
    assert.equal(nonce.status, 200);
    const issuedAt = (nonce.data as { issuedAt: string }).issuedAt;
    const verify = await req(organizer, "POST", "/api/auth/verify", {
      address: organizerAddr,
      publicKey: "0".repeat(66),
      signature: "0".repeat(130),
      issuedAt,
    });
    assert.equal(verify.status, 200, `verify status was ${verify.status}: ${JSON.stringify(verify.data)}`);
    organizerUser = (verify.data as { user: typeof organizerUser }).user;
    assert.ok(organizerUser?.id);
  });

  await step("GET /api/auth/me returns the organizer", async () => {
    const me = await req(organizer, "GET", "/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal((me.data as { user: { address: string } }).user.address, organizerAddr);
  });

  await step("buyer signs in (separate cookie jar)", async () => {
    const nonce = await req(buyer, "POST", "/api/auth/nonce", { address: buyerAddr });
    assert.equal(nonce.status, 200);
    const issuedAt = (nonce.data as { issuedAt: string }).issuedAt;
    const verify = await req(buyer, "POST", "/api/auth/verify", {
      address: buyerAddr,
      publicKey: "0".repeat(66),
      signature: "0".repeat(130),
      issuedAt,
    });
    assert.equal(verify.status, 200);
    buyerUser = (verify.data as { user: typeof buyerUser }).user;
    assert.ok(buyerUser?.id);
  });

  console.log("\nEvents");
  let eventId: string;

  await step("POST /api/events creates an event as the organizer", async () => {
    const r = await req(organizer, "POST", "/api/events", {
      title: "Smoke Test Event",
      description: "Created by scripts/smoke.ts",
      category: "Tech",
      date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      location: "Online",
      image: "https://example.com/img.jpg",
      price: "1.5",
      ticketsTotal: 3,
    });
    assert.equal(r.status, 201, `create status was ${r.status}: ${JSON.stringify(r.data)}`);
    const evt = (r.data as { event: { id: string; ticketsTotal: number; price: string } }).event;
    assert.equal(evt.ticketsTotal, 3);
    assert.equal(evt.price, "1.5");
    eventId = evt.id;
  });

  await step("POST /api/events rejects unauthenticated", async () => {
    const r = await req(makeJar(), "POST", "/api/events", {
      title: "x",
      description: "y",
      category: "Tech",
      date: new Date().toISOString(),
      location: "L",
      image: "https://example.com/i.jpg",
      price: "1",
      ticketsTotal: 1,
    });
    assert.equal(r.status, 401);
  });

  await step("GET /api/events/[id] returns the event", async () => {
    const r = await req(buyer, "GET", `/api/events/${eventId}`);
    assert.equal(r.status, 200);
    assert.equal((r.data as { event: { id: string } }).event.id, eventId);
  });

  await step("PATCH /api/events/[id] rejects non-organizer", async () => {
    const r = await req(buyer, "PATCH", `/api/events/${eventId}`, { title: "hacked" });
    assert.equal(r.status, 403);
  });

  await step("PATCH /api/events/[id] succeeds for organizer", async () => {
    const r = await req(organizer, "PATCH", `/api/events/${eventId}`, { title: "Smoke Test Event (updated)" });
    assert.equal(r.status, 200);
    assert.equal((r.data as { event: { title: string } }).event.title, "Smoke Test Event (updated)");
  });

  console.log("\nTickets (DEV_PAYMENT_BYPASS)");
  let ticketId: string;

  await step("POST /api/tickets purchases as buyer", async () => {
    const r = await req(buyer, "POST", "/api/tickets", {
      eventId,
      txId: `0xsmoke${randHex(58)}`,
      network: "testnet",
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const ticket = (r.data as { ticket: { id: string; status: string } }).ticket;
    assert.equal(ticket.status, "Valid");
    ticketId = ticket.id;
  });

  await step("GET /api/tickets/me lists the buyer's ticket", async () => {
    const r = await req(buyer, "GET", "/api/tickets/me");
    assert.equal(r.status, 200);
    const tickets = (r.data as { tickets: { id: string }[] }).tickets;
    assert.ok(tickets.some((t) => t.id === ticketId));
  });

  await step("GET /api/tickets/me is empty for organizer", async () => {
    const r = await req(organizer, "GET", "/api/tickets/me");
    assert.equal(r.status, 200);
    const tickets = (r.data as { tickets: { id: string }[] }).tickets;
    assert.ok(!tickets.some((t) => t.id === ticketId));
  });

  await step("ticketsSold incremented on event", async () => {
    const r = await req(buyer, "GET", `/api/events/${eventId}`);
    assert.equal((r.data as { event: { ticketsSold: number } }).event.ticketsSold, 1);
  });

  await step("idempotent: same txId returns existing ticket", async () => {
    const tickets = await req(buyer, "GET", "/api/tickets/me");
    const existing = (tickets.data as { tickets: { id: string; txId: string }[] }).tickets[0];
    const r = await req(buyer, "POST", "/api/tickets", {
      eventId,
      txId: existing.txId,
      network: "testnet",
    });
    assert.ok(r.status === 200, `expected 200, got ${r.status}`);
  });

  console.log("\nOrganizer");
  await step("GET /api/organizer/events lists organizer's event", async () => {
    const r = await req(organizer, "GET", "/api/organizer/events");
    assert.equal(r.status, 200);
    const evts = (r.data as { events: { id: string; revenue: string }[] }).events;
    const evt = evts.find((e) => e.id === eventId);
    assert.ok(evt, "organizer event missing");
    assert.equal(evt!.revenue, "1.5");
  });

  await step("GET /api/organizer/events/[id]/attendees lists the buyer", async () => {
    const r = await req(organizer, "GET", `/api/organizer/events/${eventId}/attendees`);
    assert.equal(r.status, 200);
    const attendees = (r.data as { attendees: { wallet: string }[] }).attendees;
    assert.ok(attendees.some((a) => a.wallet === buyerAddr));
  });

  await step("attendees endpoint rejects non-organizer", async () => {
    const r = await req(buyer, "GET", `/api/organizer/events/${eventId}/attendees`);
    assert.equal(r.status, 403);
  });

  await step("POST /api/organizer/verify marks ticket Used", async () => {
    const r = await req(organizer, "POST", "/api/organizer/verify", { ticketId });
    assert.equal(r.status, 200);
    assert.equal((r.data as { ticket: { status: string } }).ticket.status, "Used");
  });

  await step("second verify returns 409", async () => {
    const r = await req(organizer, "POST", "/api/organizer/verify", { ticketId });
    assert.equal(r.status, 409);
  });

  await step("buyer cannot verify", async () => {
    const r = await req(buyer, "POST", "/api/organizer/verify", { ticketId });
    assert.equal(r.status, 403);
  });

  console.log("\nProfile");
  await step("PATCH /api/users/me updates name and bio", async () => {
    const r = await req(buyer, "PATCH", "/api/users/me", { name: "Buyer Buyerson", bio: "hi" });
    assert.equal(r.status, 200);
    assert.equal((r.data as { user: { name: string } }).user.name, "Buyer Buyerson");
  });

  console.log("\nLogout");
  await step("POST /api/auth/logout clears session", async () => {
    const r = await req(buyer, "POST", "/api/auth/logout");
    assert.equal(r.status, 200);
    const me = await req(buyer, "GET", "/api/auth/me");
    assert.equal((me.data as { user: unknown }).user, null);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

function randHex(len: number): string {
  let s = "";
  while (s.length < len) s += Math.random().toString(16).slice(2);
  return s.slice(0, len);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
