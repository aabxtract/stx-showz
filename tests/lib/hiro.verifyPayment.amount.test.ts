import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — amount mismatch", () => {
  test("rejects underpayment", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xshort",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        // Expected 12.5 STX = 12,500,000 uSTX. We paid 12,499,999.
        token_transfer: { recipient_address: "SPESCROW", amount: "12499999" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xshort",
        expectedPriceStx: new Prisma.Decimal("12.5"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.reason, /Amount mismatch/);
    } finally {
      restoreFetch();
    }
  });

  test("rejects overpayment (treated as suspicious, not generosity)", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xover",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SPESCROW", amount: "13000000" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xover",
        expectedPriceStx: new Prisma.Decimal("12.5"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
    } finally {
      restoreFetch();
    }
  });
});
