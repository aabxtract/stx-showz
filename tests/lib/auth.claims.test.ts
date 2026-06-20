import jwt from "jsonwebtoken";
import { describe, test, assert } from "../_harness";

const SECRET = "test-secret-do-not-use-in-prod-please-ignore-warnings";
process.env.JWT_SECRET = SECRET;

import { verifySession } from "../../lib/auth";

describe("lib/auth.verifySession — missing required claims", () => {
  test("returns null when address claim is missing", () => {
    const token = jwt.sign({ userId: "u1" }, SECRET, { expiresIn: 60 });
    assert.equal(verifySession(token), null);
  });

  test("returns null when userId claim is missing", () => {
    const token = jwt.sign({ address: "SPABC" }, SECRET, { expiresIn: 60 });
    assert.equal(verifySession(token), null);
  });

  test("returns null when both claims are present but empty", () => {
    const token = jwt.sign({ userId: "", address: "" }, SECRET, { expiresIn: 60 });
    assert.equal(verifySession(token), null);
  });
});
