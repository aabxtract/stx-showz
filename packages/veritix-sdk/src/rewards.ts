import type { VeritixClient } from "./client";
import type {
  RewardConfig,
  CreateRewardConfigInput,
  Disbursement,
  DisburseRewardInput,
  DisburseRewardResponse,
} from "./types";

/**
 * Token reward management operations.
 *
 * Configure per-event rewards and trigger VTX token disbursements.
 */
export class RewardsClient {
  /** @internal */
  constructor(private readonly client: VeritixClient) {}

  /**
   * Get the reward configuration for an event.
   *
   * @param eventId - The event ID
   * @returns Reward config or null if not configured
   */
  async getConfig(eventId: string): Promise<RewardConfig | null> {
    try {
      const data = await this.client.get<{ config: RewardConfig }>(
        `/api/events/${encodeURIComponent(eventId)}/rewards`,
      );
      return data.config;
    } catch {
      return null;
    }
  }

  /**
   * Set the reward configuration for an event.
   * Only the event organizer can set this.
   *
   * @param eventId - The event ID
   * @param input - Reward settings (tokens per check-in)
   * @returns The created/updated reward config
   */
  async setConfig(eventId: string, input: CreateRewardConfigInput): Promise<RewardConfig> {
    const data = await this.client.post<{ config: RewardConfig }>(
      `/api/events/${encodeURIComponent(eventId)}/rewards`,
      input,
    );
    return data.config;
  }

  /**
   * Disburse tokens to a single checked-in attendee.
   *
   * @param input - Event ID and attendee wallet address
   * @returns Disbursement record and on-chain tx ID
   */
  async disburse(input: DisburseRewardInput): Promise<DisburseRewardResponse> {
    const data = await this.client.post<DisburseRewardResponse>(
      "/api/organizer/disburse",
      input,
    );
    return data;
  }

  /**
   * Batch-disburse tokens to all checked-in attendees of an event.
   *
   * @param eventId - The event ID
   * @returns Array of disbursement records
   */
  async disburseBatch(eventId: string): Promise<Disbursement[]> {
    const data = await this.client.post<{ disbursements: Disbursement[] }>(
      "/api/organizer/disburse/batch",
      { eventId },
    );
    return data.disbursements;
  }

  /**
   * Get disbursement history for a user.
   *
   * @param userId - Optional user ID (defaults to current user)
   * @returns List of disbursements
   */
  async list(userId?: string): Promise<Disbursement[]> {
    const query: Record<string, string> = {};
    if (userId) query.userId = userId;
    const data = await this.client.get<{ disbursements: Disbursement[] }>(
      "/api/disbursements",
      query,
    );
    return data.disbursements;
  }

  /**
   * Get on-chain VTX token balance for an address.
   *
   * @param address - Wallet address to check
   * @returns Token balance (in smallest unit)
   */
  async balance(address: string): Promise<number> {
    const data = await this.client.get<{ balance: number }>(
      `/api/disbursements/balance/${encodeURIComponent(address)}`,
    );
    return data.balance;
  }
}
