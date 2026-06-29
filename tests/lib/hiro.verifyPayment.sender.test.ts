import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — sender mismatch", () => {
  test("rejects when the on-chain sender is not the claimed buyer", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xreplay",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPSOMEONEELSE",
        token_transfer: { recipient_address: "SPESCROW", amount: "12500000" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xreplay",
        expectedPriceStx: new Prisma.Decimal("12.5"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.reason, /Sender does not match buyer/);
    } finally {
      restoreFetch();
    }
  });
});
