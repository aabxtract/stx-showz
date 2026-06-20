import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { fetchTx } from "../../lib/hiro";

describe("lib/hiro.fetchTx — upstream errors", () => {
  test("throws on 500 so callers don't silently treat outage as 'unconfirmed'", async () => {
    mockFetch(() => ({ status: 500, body: { error: "upstream" } }));
    try {
      await assert.rejects(() => fetchTx("testnet", "0xany"), /Hiro API 500/);
    } finally {
      restoreFetch();
    }
  });

  test("throws on 502 (gateway timeout etc)", async () => {
    mockFetch(() => ({ status: 502, body: {} }));
    try {
      await assert.rejects(() => fetchTx("testnet", "0xany"), /Hiro API 502/);
    } finally {
      restoreFetch();
    }
  });
});
