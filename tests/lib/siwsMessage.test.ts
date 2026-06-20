import { describe, test, assert } from "../_harness";
import { buildSignInMessage } from "../../lib/siwsMessage";

describe("siwsMessage.buildSignInMessage — required fields", () => {
  test("includes the address verbatim on its own line", () => {
    const msg = buildSignInMessage({
      address: "SP3JRJTXR5JS74DKHW9EHEB4WB7B0MMZ3X9SBD3FJ",
      nonce: "abc",
      issuedAt: "2026-01-01T00:00:00.000Z",
    });
    const lines = msg.split("\n");
    assert.equal(lines[1], "SP3JRJTXR5JS74DKHW9EHEB4WB7B0MMZ3X9SBD3FJ");
  });

  test("includes Nonce: <value> line", () => {
    const msg = buildSignInMessage({
      address: "x",
      nonce: "deadbeef",
      issuedAt: "t",
    });
    assert.match(msg, /\nNonce: deadbeef\n/);
  });

  test("includes Issued At: <value> line", () => {
    const msg = buildSignInMessage({
      address: "x",
      nonce: "n",
      issuedAt: "2026-06-19T12:00:00.000Z",
    });
    assert.match(msg, /\nIssued At: 2026-06-19T12:00:00\.000Z$/);
  });
});
