import { Prisma } from "@prisma/client";
import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { verifyStacksPayment } from "../../lib/hiro";

describe("lib/hiro.verifyTicketPayment — mainnet escrow routing", () => {
  test("reads ESCROW_ADDRESS_MAINNET (not the testnet var) for mainnet calls", async () => {
    process.env.ESCROW_ADDRESS_TESTNET = "SP_TESTNET_ESCROW";
    process.env.ESCROW_ADDRESS_MAINNET = "SP_MAINNET_ESCROW";

    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xmain",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        // Pay the *testnet* escrow but claim it's a mainnet tx. Must reject.
        token_transfer: {
          recipient_address: "SP_TESTNET_ESCROW",
          amount: "1000000",
        },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "mainnet",
        txId: "0xmain",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.reason, /Recipient is not escrow/);
    } finally {
      restoreFetch();
    }
  });

  test("accepts a payment to the mainnet escrow on mainnet", async () => {
    process.env.ESCROW_ADDRESS_MAINNET = "SP_MAINNET_ESCROW";
    mockFetch(() => ({
      status: 200,
      body: {
        tx_id: "0xmain_ok",
        tx_status: "success",
        tx_type: "token_transfer",
        sender_address: "SPBUYER",
        token_transfer: { recipient_address: "SP_MAINNET_ESCROW", amount: "1000000" },
      },
    }));
    try {
      const result = await verifyStacksPayment({
        network: "mainnet",
        txId: "0xmain_ok",
        expectedPriceStx: new Prisma.Decimal("1"),
        buyerAddress: "SPBUYER",
      });
      assert.equal(result.ok, true);
    } finally {
      restoreFetch();
    }
  });
});
