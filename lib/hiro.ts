import { Prisma } from "@prisma/client";

export type StacksNetwork = "testnet" | "mainnet";
export type TxNetwork = "stacks" | "bitcoin";

interface HiroStacksTx {
  tx_id: string;
  tx_status: string;
  tx_type: string;
  sender_address: string;
  token_transfer?: {
    recipient_address: string;
    amount: string;
    memo?: string;
  };
}

interface HiroBitcoinTx {
  tx_id: string;
  tx_status: string;
  sender_address: string;
  bitcoin_inputs: Array<{
    address: string;
    value: number;
  }>;
  bitcoin_outputs: Array<{
    address: string;
    value: number;
  }>;
}

function apiBase(network: StacksNetwork): string {
  if (network === "mainnet") {
    return process.env.HIRO_API_MAINNET || "https://api.hiro.so";
  }
  return process.env.HIRO_API_TESTNET || "https://api.testnet.hiro.so";
}

function escrowAddress(network: StacksNetwork): string | undefined {
  return network === "mainnet"
    ? process.env.ESCROW_ADDRESS_MAINNET
    : process.env.ESCROW_ADDRESS_TESTNET;
}

export async function fetchStacksTx(network: StacksNetwork, txId: string): Promise<HiroStacksTx | null> {
  const url = `${apiBase(network)}/extended/v1/tx/${encodeURIComponent(txId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Hiro API ${res.status}`);
  return (await res.json()) as HiroStacksTx;
}

export async function fetchBitcoinTx(txId: string): Promise<HiroBitcoinTx | null> {
  // Bitcoin mainnet only — Hiro API at api.hiro.so
  const url = `https://api.hiro.so/extended/v1/tx/${encodeURIComponent(txId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Hiro API ${res.status}`);
  return (await res.json()) as HiroBitcoinTx;
}

/** @deprecated Use fetchStacksTx or fetchBitcoinTx instead */
export const fetchTx = fetchStacksTx;

export type TxCheckResult =
  | { ok: true; status: "confirmed"; sender: string }
  | { ok: false; status: "pending" | "failed"; reason: string };

export async function verifyStacksPayment(params: {
  network: StacksNetwork;
  txId: string;
  expectedPriceStx: Prisma.Decimal;
  buyerAddress: string;
}): Promise<TxCheckResult> {
  const { network, txId, expectedPriceStx, buyerAddress } = params;

  const escrow = escrowAddress(network);
  if (!escrow) {
    return { ok: false, status: "failed", reason: "Escrow address not configured" };
  }

  const tx = await fetchStacksTx(network, txId);
  if (!tx) return { ok: false, status: "pending", reason: "Transaction not found yet" };

  if (tx.tx_status === "pending") {
    return { ok: false, status: "pending", reason: "Transaction pending" };
  }
  if (tx.tx_status !== "success") {
    return { ok: false, status: "failed", reason: `Transaction ${tx.tx_status}` };
  }
  if (tx.tx_type !== "token_transfer" || !tx.token_transfer) {
    return { ok: false, status: "failed", reason: "Not a token_transfer" };
  }
  if (tx.token_transfer.recipient_address !== escrow) {
    return { ok: false, status: "failed", reason: "Recipient is not escrow" };
  }
  if (tx.sender_address !== buyerAddress) {
    return { ok: false, status: "failed", reason: "Sender does not match buyer" };
  }

  const expectedMicroStx = expectedPriceStx.mul(1_000_000);
  const paidMicroStx = new Prisma.Decimal(tx.token_transfer.amount);
  if (!paidMicroStx.eq(expectedMicroStx)) {
    return { ok: false, status: "failed", reason: "Amount mismatch" };
  }

  return { ok: true, status: "confirmed", sender: tx.sender_address };
}

export async function verifyBitcoinPayment(params: {
  txId: string;
  expectedPriceBtc: number;
  buyerAddress: string;
}): Promise<TxCheckResult> {
  const { txId, expectedPriceBtc, buyerAddress } = params;

  const tx = await fetchBitcoinTx(txId);
  if (!tx) return { ok: false, status: "pending", reason: "Transaction not found yet" };

  if (tx.tx_status === "pending") {
    return { ok: false, status: "pending", reason: "Transaction pending" };
  }
  if (tx.tx_status !== "success") {
    return { ok: false, status: "failed", reason: `Transaction ${tx.tx_status}` };
  }

  // Check buyer is the sender
  const senderInputs = tx.bitcoin_inputs.filter((i) => i.address === buyerAddress);
  if (senderInputs.length === 0) {
    return { ok: false, status: "failed", reason: "Buyer is not a sender on this tx" };
  }

  // Check total sent matches expected price (in satoshis)
  const totalSentSatoshis = senderInputs.reduce((sum, i) => sum + i.value, 0);
  const expectedSatoshis = Math.round(expectedPriceBtc * 100_000_000);

  // Allow ±1 satoshi tolerance for rounding
  if (Math.abs(totalSentSatoshis - expectedSatoshis) > 1) {
    return { ok: false, status: "failed", reason: "Amount mismatch" };
  }

  return { ok: true, status: "confirmed", sender: buyerAddress };
}

/**
 * Unified verification — delegates to Stacks or Bitcoin verifier.
 */
export async function verifyTicketPayment(params: {
  network: TxNetwork;
  stacksNetwork?: StacksNetwork;
  txId: string;
  expectedPriceStx: Prisma.Decimal;
  buyerAddress: string;
}): Promise<TxCheckResult> {
  if (params.network === "bitcoin") {
    return verifyBitcoinPayment({
      txId: params.txId,
      expectedPriceBtc: parseFloat(params.expectedPriceStx.toString()),
      buyerAddress: params.buyerAddress,
    });
  }
  return verifyStacksPayment({
    network: params.stacksNetwork ?? (process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet"),
    txId: params.txId,
    expectedPriceStx: params.expectedPriceStx,
    buyerAddress: params.buyerAddress,
  });
}
