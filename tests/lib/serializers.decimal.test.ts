import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { serializeEvent } from "../../lib/serializers";

function makeEvent(price: string) {
  return {
    id: "evt",
    title: "T",
    description: "D",
    category: "Music" as const,
    date: new Date("2026-07-01T00:00:00.000Z"),
    location: "L",
    image: "i",
    price: new Prisma.Decimal(price),
    ticketsTotal: 10,
    ticketsSold: 0,
    status: "Active" as const,
    organizerId: "u",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("serializers.serializeEvent — Decimal precision", () => {
  test("preserves full 6-digit precision (microSTX granularity)", () => {
    const out = serializeEvent(makeEvent("0.123456"));
    assert.equal(out.price, "0.123456");
  });

  test("does not introduce float drift on tricky values", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in float; Decimal must not corrupt this.
    const out = serializeEvent(makeEvent("0.3"));
    assert.equal(out.price, "0.3");
  });

  test("serializes zero correctly", () => {
    const out = serializeEvent(makeEvent("0"));
    assert.equal(out.price, "0");
  });

  test("handles large values without scientific notation", () => {
    const out = serializeEvent(makeEvent("1000000.5"));
    assert.equal(out.price, "1000000.5");
    assert.ok(!out.price.includes("e"), "must not use exponent notation");
  });
});
