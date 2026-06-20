import { describe, test, assert } from "../_harness";
import { buildSignInMessage } from "../../lib/siwsMessage";

describe("siwsMessage.buildSignInMessage — domain handling", () => {
  test("defaults to veritix.app when domain is omitted", () => {
    const msg = buildSignInMessage({ address: "x", nonce: "n", issuedAt: "t" });
    assert.match(msg, /^veritix\.app wants you to sign in/);
  });

  test("uses custom domain when provided", () => {
    const msg = buildSignInMessage({
      address: "x",
      nonce: "n",
      issuedAt: "t",
      domain: "staging.veritix.app",
    });
    assert.match(msg, /^staging\.veritix\.app wants you to sign in/);
  });

  test("custom domain does not leak into other lines", () => {
    const msg = buildSignInMessage({
      address: "x",
      nonce: "n",
      issuedAt: "t",
      domain: "evil.com",
    });
    const lines = msg.split("\n");
    // Only the first line should contain the domain
    const occurrences = lines.filter((l) => l.includes("evil.com")).length;
    assert.equal(occurrences, 1);
  });
});
