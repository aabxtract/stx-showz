import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — happy path", () => {
  test("returns ok when sender, recipient, and amount all match", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xok",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SPESCROW", amount: "12500000" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xok",
        expectedPriceStx: new Prisma.Decimal("12.5"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, true);
      assert.equal(result.status, "confirmed");
      if (result.ok) assert.equal(result.sender, "SPBUYER");
    } finally {
      restoreFetch();
    }
  });
});
