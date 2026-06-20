import { describe, test, assert } from "../_harness";
import { toAppEvent } from "../../lib/apiClient";

const baseSdkEvent = {
  id: "evt_1",
  title: "T",
  description: "D",
  category: "Music",
  date: "2026-07-01T18:00:00.000Z",
  location: "Online",
  image: "img.png",
  price: "12.500000",
  ticketsTotal: 100,
  ticketsSold: 30,
  ticketsLeft: 70,
  status: "Active",
  organizerId: "user_1",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-15T00:00:00.000Z",
};

describe("lib/apiClient.toAppEvent", () => {
  test("converts price string to a number", () => {
    const e = toAppEvent(baseSdkEvent);
    assert.equal(e.price, 12.5);
    assert.equal(typeof e.price, "number");
  });

  test("falls back to organizerId when organizer relation is absent", () => {
    const e = toAppEvent(baseSdkEvent);
    assert.equal(e.organizer, "user_1");
  });

  test("uses organizer.address when relation is present", () => {
    const e = toAppEvent({
      ...baseSdkEvent,
      organizer: { address: "SPABC", name: "Alice" },
    });
    assert.equal(e.organizer, "SPABC");
  });

  test("maps SoldOut -> 'Sold Out' (with space) for UI display", () => {
    const e = toAppEvent({ ...baseSdkEvent, status: "SoldOut" });
    assert.equal(e.status, "Sold Out");
  });

  test("falls back to Active for unknown status values", () => {
    const e = toAppEvent({ ...baseSdkEvent, status: "Unrecognized" as any });
    assert.equal(e.status, "Active");
  });
});
