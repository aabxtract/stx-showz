import type { VeritixClient } from "./client";
import type { User, UpdateProfileInput } from "./types";

/**
 * User profile operations.
 *
 * @example
 * ```typescript
 * // Update your profile
 * const user = await veritix.users.updateProfile({
 *   name: 'Anuoluwapo',
 *   bio: 'Event organizer & Stacks builder',
 * });
 *
 * // Get your profile
 * const me = await veritix.users.me();
 * ```
 */
export class UsersClient {
  /** @internal */
  constructor(private readonly client: VeritixClient) {}

  /**
   * Get the current user's profile.
   *
   * @returns The user profile, or `null` if not authenticated
   */
  async me(): Promise<User | null> {
    const data = await this.client.get<{ user: User | null }>("/api/auth/me");
    return data.user;
  }

  /**
   * Update the current user's profile.
   *
   * All fields are optional — only the provided fields are updated.
   * Pass `null` to clear a field.
   *
   * @param input - Profile fields to update
   * @returns The updated user profile
   * @throws {VeritixAuthError} If not authenticated
   * @throws {VeritixValidationError} If input is invalid
   */
  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const data = await this.client.patch<{ user: User }>("/api/users/me", input);
    return data.user;
  }
}
