import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { fetchTx } from "../../lib/hiro";

describe("lib/hiro.fetchTx — txId encoding", () => {
  test("URL-encodes the txId so weird input cannot inject path segments", async () => {
    let hit = "";
    mockFetch((url) => {
      hit = url;
      return { status: 404, body: {} };
    });
    try {
      await fetchTx("testnet", "0xabc/../../secret");
      // The slashes should be encoded, not passed through into the path.
      assert.ok(
        !hit.endsWith("0xabc/../../secret"),
        `URL was not encoded: ${hit}`,
      );
      assert.match(hit, /0xabc%2F\.\.%2F\.\.%2Fsecret$/);
    } finally {
      restoreFetch();
    }
  });

  test("preserves a normal hex txId untouched", async () => {
    let hit = "";
    mockFetch((url) => {
      hit = url;
      return { status: 404, body: {} };
    });
    try {
      const txId = "0x6196ccfd3f4afad9eb6c2e3a97256b11758358de6b125bc531536ebfff256b01";
      await fetchTx("mainnet", txId);
      assert.ok(hit.endsWith(txId), `tx id was mangled: ${hit}`);
    } finally {
      restoreFetch();
    }
  });
});
