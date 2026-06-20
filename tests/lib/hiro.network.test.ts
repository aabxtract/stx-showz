import { describe, test, assert } from "../_harness";
import { mockFetch, restoreFetch } from "../_helpers/mockFetch";
import { fetchTx } from "../../lib/hiro";

describe("lib/hiro — network routing", () => {
  test("testnet calls api.testnet.hiro.so by default", async () => {
    delete process.env.HIRO_API_TESTNET;
    let hit = "";
    mockFetch((url) => {
      hit = url;
      return { status: 404, body: {} };
    });
    try {
      await fetchTx("testnet", "0xabc");
      assert.match(hit, /^https:\/\/api\.testnet\.hiro\.so\//);
    } finally {
      restoreFetch();
    }
  });

  test("mainnet calls api.hiro.so by default", async () => {
    delete process.env.HIRO_API_MAINNET;
    let hit = "";
    mockFetch((url) => {
      hit = url;
      return { status: 404, body: {} };
    });
    try {
      await fetchTx("mainnet", "0xabc");
      assert.match(hit, /^https:\/\/api\.hiro\.so\//);
    } finally {
      restoreFetch();
    }
  });

  test("HIRO_API_* env vars override defaults", async () => {
    process.env.HIRO_API_TESTNET = "https://my-mirror.example";
    let hit = "";
    mockFetch((url) => {
      hit = url;
      return { status: 404, body: {} };
    });
    try {
      await fetchTx("testnet", "0xabc");
      assert.match(hit, /^https:\/\/my-mirror\.example\//);
    } finally {
      delete process.env.HIRO_API_TESTNET;
      restoreFetch();
    }
  });
});
