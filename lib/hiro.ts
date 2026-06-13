import { Prisma } from "@prisma/client";

export type StacksNetwork = "testnet" | "mainnet";

interface HiroTx {
  tx_id: string;
  tx_status: string; // "success" | "pending" | "abort_by_response" | "abort_by_post_condition"
  tx_type: string; // "token_transfer" | ...
  sender_address: string;
  token_transfer?: {
    recipient_address: string;
    amount: string; // microSTX as string
    memo?: string;
  };
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

export async function fetchTx(network: StacksNetwork, txId: string): Promise<HiroTx | null> {
  const url = `${apiBase(network)}/extended/v1/tx/${encodeURIComponent(txId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Hiro API ${res.status}`);
  return (await res.json()) as HiroTx;
}

export type TxCheckResult =
  | { ok: true; status: "confirmed"; sender: string }
  | { ok: false; status: "pending" | "failed"; reason: string };

export async function verifyTicketPayment(params: {
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

  const tx = await fetchTx(network, txId);
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
