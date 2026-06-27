import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { serializeEvent } from "../../lib/serializers";

const baseEvent = {
  id: "evt_1",
  title: "Showz Launch",
  description: "Mainnet release party",
  category: "Music" as const,
  date: new Date("2026-07-01T18:00:00.000Z"),
  location: "Online",
  image: "https://example.com/img.png",
  price: new Prisma.Decimal("12.500000"),
  network: "stacks",
  ticketsTotal: 100,
  ticketsSold: 30,
  status: "Active" as const,
  organizerId: "user_1",
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: new Date("2026-06-15T00:00:00.000Z"),
};

describe("serializers.serializeEvent — happy path", () => {
  test("converts Decimal price to string", () => {
    const out = serializeEvent(baseEvent);
    assert.equal(out.price, "12.5");
  });

  test("computes ticketsLeft as total - sold", () => {
    const out = serializeEvent(baseEvent);
    assert.equal(out.ticketsLeft, 70);
  });

  test("serializes Date fields to ISO strings", () => {
    const out = serializeEvent(baseEvent);
    assert.equal(out.date, "2026-07-01T18:00:00.000Z");
    assert.equal(out.createdAt, "2026-06-01T00:00:00.000Z");
    assert.equal(out.updatedAt, "2026-06-15T00:00:00.000Z");
  });
});
