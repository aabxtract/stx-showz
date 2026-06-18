import type { VeritixClient } from "./client";
import type { NonceResponse, VerifyAuthInput, AuthResponse, User } from "./types";

/**
 * Authentication operations for the Veritix API.
 *
 * Implements the Sign-In with Stacks (SIWS) flow:
 * 1. Request a nonce for an address
 * 2. Sign the message with the user's wallet
 * 3. Verify the signature to establish a session
 *
 * @example
 * ```typescript
 * // Step 1: Get nonce
 * const { nonce, message, issuedAt } = await veritix.auth.getNonce('SP1234...');
 *
 * // Step 2: User signs `message` with their Stacks wallet (outside the SDK)
 *
 * // Step 3: Verify signature
 * const { user } = await veritix.auth.verify({
 *   address: 'SP1234...',
 *   publicKey: '...',
 *   signature: '...',
 *   issuedAt,
 * });
 * ```
 */
export class AuthClient {
  /** @internal */
  constructor(private readonly client: VeritixClient) {}

  /**
   * Request an authentication nonce for a Stacks address.
   *
   * The response includes a `message` string that the user must sign
   * with their wallet to authenticate.
   *
   * @param address - The Stacks wallet address (e.g. "SP1ABC...")
   * @returns Nonce, message to sign, and timestamp
   */
  async getNonce(address: string): Promise<NonceResponse> {
    return this.client.post<NonceResponse>("/api/auth/nonce", { address });
  }

  /**
   * Verify a signed authentication message and establish a session.
   *
   * On success, if the client is in cookie mode (browser), the session
   * cookie is set automatically. In token mode, the returned token
   * should be stored and passed to `client.setToken()`.
   *
   * @param input - Address, public key, signature, and issuedAt timestamp
   * @returns The authenticated user profile
   */
  async verify(input: VerifyAuthInput): Promise<AuthResponse> {
    return this.client.post<AuthResponse>("/api/auth/verify", input);
  }

  /**
   * Get the currently authenticated user, or `null` if not logged in.
   */
  async me(): Promise<User | null> {
    const data = await this.client.get<{ user: User | null }>("/api/auth/me");
    return data.user;
  }

  /**
   * Log out and clear the session.
   */
  async logout(): Promise<void> {
    await this.client.post<{ ok: boolean }>("/api/auth/logout");
  }
}
