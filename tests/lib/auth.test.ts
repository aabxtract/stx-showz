import { describe, test, assert } from "../_harness";

// JWT_SECRET must be set BEFORE importing lib/auth (getSecret reads at call time but
// some envs cache module-level values; setting early is safest).
process.env.JWT_SECRET = "test-secret-do-not-use-in-prod-please-ignore-warnings";

import { signSession, verifySession } from "../../lib/auth";

describe("lib/auth — signSession + verifySession round-trip", () => {
  test("verifies a session it just signed", () => {
    const token = signSession({ userId: "u1", address: "SPABC" });
    const decoded = verifySession(token);
    assert.deepEqual(decoded, { userId: "u1", address: "SPABC" });
  });

  test("produces different tokens for different payloads", () => {
    const a = signSession({ userId: "u1", address: "SPA" });
    const b = signSession({ userId: "u2", address: "SPB" });
    assert.notEqual(a, b);
  });

  test("verifySession returns the exact payload — no extra leakage", () => {
    const token = signSession({ userId: "u1", address: "SPABC" });
    const decoded = verifySession(token);
    assert.ok(decoded);
    // Caller may iterate keys; pin them.
    assert.deepEqual(Object.keys(decoded!).sort(), ["address", "userId"]);
  });
});
