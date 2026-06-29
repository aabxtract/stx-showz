import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — wrong tx type", () => {
  test("rejects a contract_call submitted as a ticket payment", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SPESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xcall",
        tx_status: "success",
        tx_type: "contract_call",
        sender_address: "SPBUYER",
        // No token_transfer field at all on a contract_call.
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xcall",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.reason, /Not a token_transfer/);
    } finally {
      restoreFetch();
    }
  });
});
