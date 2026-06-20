import { describe, test, assert } from "../_harness";

process.env.JWT_SECRET = "test-secret-do-not-use-in-prod-please-ignore-warnings";

import { verifySession } from "../../lib/auth";

describe("lib/auth.verifySession — invalid tokens", () => {
  test("returns null for garbage token", () => {
    assert.equal(verifySession("not-a-jwt"), null);
  });

  test("returns null for empty string", () => {
    assert.equal(verifySession(""), null);
  });

  test("returns null for a JWT signed with a different secret", () => {
    // Hand-rolled HS256 JWT with a wrong secret, payload {userId:"x",address:"y"}
    // Header: {"alg":"HS256","typ":"JWT"}
    const wrong =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJ1c2VySWQiOiJ4IiwiYWRkcmVzcyI6InkifQ." +
      "this_signature_will_not_validate_against_test_secret";
    assert.equal(verifySession(wrong), null);
  });
});
