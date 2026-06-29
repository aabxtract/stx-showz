import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { serializeEvent } from "../../lib/serializers";

const baseEvent = {
  id: "evt_1",
  title: "T",
  description: "D",
  category: "Tech" as const,
  date: new Date("2026-07-01T00:00:00.000Z"),
  location: "L",
  image: "i",
  price: new Prisma.Decimal("0"),
  network: "stacks",
  ticketsTotal: 1,
  ticketsSold: 0,
  status: "Active" as const,
  organizerId: "user_1",
  createdAt: new Date(),
  updatedAt: new Date(),
  onChainEventId: null,
  onChainTxId: null,
};

describe("serializers.serializeEvent — organizer field", () => {
  test("omits organizer when not joined", () => {
    const out = serializeEvent(baseEvent);
    assert.equal(out.organizer, undefined);
  });

  test("includes organizer when joined", () => {
    const out = serializeEvent({
      ...baseEvent,
      organizer: { address: "SPABC", name: "Alice" },
    });
    assert.deepEqual(out.organizer, { address: "SPABC", name: "Alice" });
  });

  test("organizerId is always present even when organizer relation is null", () => {
    const out = serializeEvent({ ...baseEvent, organizer: null });
    assert.equal(out.organizerId, "user_1");
    assert.equal(out.organizer, undefined);
  });
});
