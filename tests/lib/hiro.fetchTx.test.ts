import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { fetchTx } from "../../lib/hiro";

describe("lib/hiro.fetchTx — happy path", () => {
  test("returns the parsed transaction body on 200", async () => {
    mockFetch((url) => {
      if (url.includes("/extended/v1/tx/0xabc")) {
        return {
          status: 200,
          body: {
            tx_id: "0xabc",
            tx_status: "success",
            tx_type: "token_transfer",
            sender_address: "SPSENDER",
            token_transfer: { recipient_address: "SPESCROW", amount: "1000000" },
          },
        };
      }
    });
    try {
      const tx = await fetchTx("testnet", "0xabc");
      assert.ok(tx);
      assert.equal(tx!.tx_id, "0xabc");
      assert.equal(tx!.tx_status, "success");
      assert.equal(tx!.sender_address, "SPSENDER");
    } finally {
      restoreFetch();
    }
  });
});
