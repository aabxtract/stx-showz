import assert from "node:assert/strict";
import { buildSignInMessage } from "../lib/siwsMessage";
import { serializeEvent } from "../lib/serializers";
import { Prisma } from "@prisma/client";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(e as Error).message}`);
    failed++;
  }
}

console.log("siwsMessage.buildSignInMessage");
test("includes address, nonce and issuedAt", () => {
  const msg = buildSignInMessage({
    address: "SP123",
    nonce: "abc",
    issuedAt: "2026-01-01T00:00:00.000Z",
  });
  assert.match(msg, /SP123/);
  assert.match(msg, /Nonce: abc/);
  assert.match(msg, /Issued At: 2026-01-01T00:00:00.000Z/);
});

test("defaults domain to veritix.app", () => {
  const msg = buildSignInMessage({ address: "x", nonce: "n", issuedAt: "t" });
  assert.match(msg, /^veritix\.app wants/);
});

test("respects custom domain", () => {
  const msg = buildSignInMessage({ address: "x", nonce: "n", issuedAt: "t", domain: "foo.io" });
  assert.match(msg, /^foo\.io wants/);
});

console.log("\nserializers.serializeEvent");
test("converts Decimal price to string and computes ticketsLeft", () => {
  const out = serializeEvent({
    id: "e1",
    title: "T",
    description: "D",
    category: "Music",
    date: new Date("2026-06-01T00:00:00Z"),
    location: "L",
    image: "i",
    price: new Prisma.Decimal("12.5") as unknown as Prisma.Decimal,
    network: "stacks",
    ticketsTotal: 100,
    ticketsSold: 30,
    status: "Active",
    organizerId: "u1",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    onChainEventId: null,
    onChainTxId: null,
    organizer: { address: "SP1", name: null },
  });
  assert.equal(out.price, "12.5");
  assert.equal(out.ticketsLeft, 70);
  assert.equal(out.date, "2026-06-01T00:00:00.000Z");
  assert.deepEqual(out.organizer, { address: "SP1", name: null });
});

test("works without organizer relation", () => {
  const out = serializeEvent({
    id: "e2",
    title: "T",
    description: "D",
    category: "Tech",
    date: new Date(),
    location: "L",
    image: "i",
    price: new Prisma.Decimal("1") as unknown as Prisma.Decimal,
    network: "stacks",
    ticketsTotal: 10,
    ticketsSold: 0,
    status: "Active",
    organizerId: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
    onChainEventId: null,
    onChainTxId: null,
  });
  assert.equal(out.organizer, undefined);
  assert.equal(out.ticketsLeft, 10);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
