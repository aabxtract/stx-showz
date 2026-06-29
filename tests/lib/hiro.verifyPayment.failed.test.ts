import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — abort statuses", () => {
  test("rejects abort_by_response", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xabort",
        tx_status: "abort_by_response",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SPESCROW", amount: "1000000" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xabort",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.status, "failed");
        assert.match(result.reason, /abort_by_response/);
      }
    } finally {
      restoreFetch();
    }
  });

  test("rejects abort_by_post_condition", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xpc",
        tx_status: "abort_by_post_condition",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SPESCROW", amount: "1000000" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xpc",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.status, "failed");
    } finally {
      restoreFetch();
    }
  });
});
