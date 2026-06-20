import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyTicketPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — wrong recipient", () => {
  test("rejects when STX went to an address other than escrow", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xrugged",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SPATTACKER", amount: "12500000" },
      },
    }));
    try {
      const result = await verifyTicketPayment({
        network: "testnet",
        txId: "0xrugged",
        expectedPriceStx: new Prisma.Decimal("12.5"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.status, "failed");
        assert.match(result.reason, /Recipient is not escrow/);
      }
    } finally {
      restoreFetch();
    }
  });
});
