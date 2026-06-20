import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyTicketPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — pending statuses", () => {
  test("returns pending when tx not found yet (404)", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({ status: 404, body: {} }));
    try {
      const result = await verifyTicketPayment({
        network: "testnet",
        txId: "0xnotyet",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.status, "pending");
        assert.match(result.reason, /not found/i);
      }
    } finally {
      restoreFetch();
    }
  });

  test("returns pending when Hiro reports tx_status: 'pending'", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xpending",
        tx_status: "pending",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SPESCROW", amount: "1000000" },
      },
    }));
    try {
      const result = await verifyTicketPayment({
        network: "testnet",
        txId: "0xpending",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.status, "pending");
    } finally {
      restoreFetch();
    }
  });
});
