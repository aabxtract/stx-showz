export interface SignInMessageParams {
  address: string;
  nonce: string;
  issuedAt: string;
  domain?: string;
}

export function buildSignInMessage({
  address,
  nonce,
  issuedAt,
  domain = "veritix.app",
}: SignInMessageParams): string {
  return [
    `${domain} wants you to sign in with your Stacks account:`,
    address,
    "",
    "Sign this message to authenticate with Veritix.",
    "",
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}
