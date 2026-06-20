import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { fetchTx } from "../../lib/hiro";

describe("lib/hiro.fetchTx — not found", () => {
  test("returns null on 404 (tx propagating or never existed)", async () => {
    mockFetch(() => ({ status: 404, body: { error: "Not Found" } }));
    try {
      const tx = await fetchTx("mainnet", "0xmissing");
      assert.equal(tx, null);
    } finally {
      restoreFetch();
    }
  });
});
