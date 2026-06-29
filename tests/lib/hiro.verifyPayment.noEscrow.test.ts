import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — escrow not configured", () => {
  test("returns failed without calling Hiro when escrow address is unset", async () => {
    // Wipe both escrow vars so neither network resolves.
    delete process.env.ESCROW_ADDRESS_TESTNET;
    delete process.env.ESCROW_ADDRESS_MAINNET;

    let fetched = false;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      fetched = true;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      const result = await verifyStacksPayment({
        network: "testnet",
        txId: "0xany",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.status, "failed");
        assert.match(result.reason, /Escrow address not configured/);
      }
      assert.equal(fetched, false, "must not call Hiro when escrow is unset");
    } finally {
      globalThis.fetch = orig;
    }
  });
});
