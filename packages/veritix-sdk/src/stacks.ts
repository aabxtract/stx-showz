import type { BuildTransferOptions, StacksNetworkName } from "./types";

/**
 * Stacks blockchain helpers for building ticket purchase transactions.
 *
 * These utilities require the optional peer dependency `@stacks/transactions`.
 * Install it separately:
 *
 * ```bash
 * npm install @stacks/transactions
 * ```
 *
 * @example
 * ```typescript
 * import { buildTicketTransfer, getEscrowAddress } from 'veritix-sdk';
 *
 * const txOptions = buildTicketTransfer({
 *   recipientAddress: getEscrowAddress('testnet'),
 *   amountStx: '5.0',
 *   memo: 'Ticket for event-123',
 *   network: 'testnet',
 * });
 *
 * // Use with @stacks/transactions to broadcast
 * import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';
 * const tx = await makeSTXTokenTransfer({ ...txOptions, senderKey: '...' });
 * const result = await broadcastTransaction(tx);
 * ```
 */

/**
 * Well-known escrow addresses for the Veritix platform.
 * Override these with your own if self-hosting.
 */
const ESCROW_ADDRESSES: Record<StacksNetworkName, string | undefined> = {
  testnet: undefined,
  mainnet: undefined,
};

/**
 * Configure the escrow addresses for the Veritix platform.
 *
 * Call this once at startup if you know your platform's escrow addresses.
 *
 * @param addresses - Map of network name to escrow wallet address
 *
 * @example
 * ```typescript
 * import { setEscrowAddresses } from 'veritix-sdk';
 *
 * setEscrowAddresses({
 *   testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   mainnet: 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD7R',
 * });
 * ```
 */
export function setEscrowAddresses(
  addresses: Partial<Record<StacksNetworkName, string>>,
): void {
  if (addresses.testnet) ESCROW_ADDRESSES.testnet = addresses.testnet;
  if (addresses.mainnet) ESCROW_ADDRESSES.mainnet = addresses.mainnet;
}

/**
 * Get the configured escrow address for a given network.
 *
 * @param network - "testnet" or "mainnet"
 * @returns The escrow address
 * @throws If no escrow address is configured for the network
 */
export function getEscrowAddress(network: StacksNetworkName = "testnet"): string {
  const address = ESCROW_ADDRESSES[network];
  if (!address) {
    throw new Error(
      `No escrow address configured for ${network}. ` +
      `Call setEscrowAddresses() first or pass recipientAddress directly.`,
    );
  }
  return address;
}

/**
 * Build the transaction options for an STX token transfer to purchase a ticket.
 *
 * Returns an object compatible with `@stacks/transactions`'s
 * `makeSTXTokenTransfer()` — you just need to add your `senderKey`.
 *
 * @param options - Transfer parameters
 * @returns Transaction options object ready for `makeSTXTokenTransfer()`
 *
 * @example
 * ```typescript
 * import { buildTicketTransfer } from 'veritix-sdk';
 * import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';
 *
 * const txOptions = buildTicketTransfer({
 *   recipientAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
 *   amountStx: '5.0',
 *   memo: 'event-abc123',
 *   network: 'testnet',
 * });
 *
 * const tx = await makeSTXTokenTransfer({
 *   ...txOptions,
 *   senderKey: 'your-private-key',
 * });
 *
 * const result = await broadcastTransaction(tx);
 * console.log('Transaction ID:', result.txid);
 * ```
 */
export function buildTicketTransfer(options: BuildTransferOptions): {
  recipient: string;
  amount: bigint;
  memo: string;
  network: StacksNetworkName;
  anchorMode: number;
} {
  const {
    recipientAddress,
    amountStx,
    memo = "",
    network = "testnet",
  } = options;

  if (!recipientAddress) {
    throw new Error("recipientAddress is required");
  }

  const microStx = stxToMicroStx(amountStx);

  return {
    recipient: recipientAddress,
    amount: BigInt(microStx),
    memo,
    network,
    // AnchorMode.Any = 3 — avoids requiring an import from @stacks/transactions
    anchorMode: 3,
  };
}

/**
 * Helper to construct a SIWS (Sign-In with Stacks) message.
 *
 * This replicates the message format used by the Veritix server,
 * useful for client-side message construction before signing.
 *
 * @param params - Address, nonce, issuedAt, and optional domain
 * @returns The message string to sign
 */
export function buildSignInMessage(params: {
  address: string;
  nonce: string;
  issuedAt: string;
  domain?: string;
}): string {
  const { address, nonce, issuedAt, domain = "veritix.app" } = params;
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
