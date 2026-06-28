/**
 * Server-side Stacks transaction broadcasting.
 * Used for minting VTX tokens and interacting with event-registry on-chain.
 */
import {
  makeContractCall,
  broadcastTransaction,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  boolCV,
} from "@stacks/transactions";

const NETWORK = process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet";
const DEPLOYER_KEY = process.env.STACKS_DEPLOYER_KEY!;
const TOKEN_CONTRACT = process.env.VERITIX_TOKEN_CONTRACT!; // e.g. "ST123...ABC.veritix-token"

/**
 * Parse a contract address like "ST123ABC.veritix-token" into { address, contractName }.
 */
function parseContractId(contractId: string) {
  const [address, contractName] = contractId.split(".");
  if (!address || !contractName) throw new Error(`Invalid contract ID: ${contractId}`);
  return { address, contractName };
}

/**
 * Mint VTX tokens to a recipient via the veritix-token contract.
 * Returns the on-chain transaction ID.
 */
export async function mintTokens(
  recipientAddress: string,
  amount: number,
): Promise<string> {
  if (!DEPLOYER_KEY) throw new Error("STACKS_DEPLOYER_KEY not set");
  if (!TOKEN_CONTRACT) throw new Error("VERITIX_TOKEN_CONTRACT not set");

  const { address, contractName } = parseContractId(TOKEN_CONTRACT);

  const tx = await makeContractCall({
    contractAddress: address,
    contractName,
    functionName: "mint",
    functionArgs: [uintCV(amount), standardPrincipalCV(recipientAddress)],
    senderKey: DEPLOYER_KEY,
    network: NETWORK,
  });

  const result = await broadcastTransaction({ transaction: tx, network: NETWORK });

  if ("error" in result) {
    throw new Error(`Broadcast failed: ${result.error}`);
  }

  return result.txid;
}

/**
 * Fetch on-chain VTX token balance for an address via Hiro API.
 */
export async function getTokenBalance(address: string): Promise<number> {
  if (!TOKEN_CONTRACT) throw new Error("VERITIX_TOKEN_CONTRACT not set");

  const { address: contractAddr, contractName } = parseContractId(TOKEN_CONTRACT);
  const networkPath = NETWORK === "mainnet" ? "" : ".testnet";
  const base = `https://api${networkPath}.hiro.so`;

  const url = `${base}/extended/v1/contract/${contractAddr}.${contractName}/balances`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(`Hiro API ${res.status}`);

  const data = (await res.json()) as {
    ft_balances: Record<string, { balance: string }>;
  };

  const entry = Object.entries(data.ft_balances).find(
    ([key]) => key === "veritix-token" || key.includes("veritix"),
  );

  return entry ? parseInt(entry[1].balance, 10) : 0;
}

// ─── On-chain Event Registry ────────────────────────────────────────────────

const EVENT_REGISTRY_CONTRACT = process.env.EVENT_REGISTRY_CONTRACT!; // e.g. "ST123...ABC.event-registry"

/**
 * Register an event on-chain via the event-registry contract.
 * Returns the on-chain event ID (uint).
 */
export async function createOnChainEvent(params: {
  title: string;
  description: string;
  category: string;
  location: string;
  image: string;
  eventDateUnix: number;
  priceUstx: number;
  ticketsTotal: number;
}): Promise<number> {
  if (!DEPLOYER_KEY) throw new Error("STACKS_DEPLOYER_KEY not set");
  if (!EVENT_REGISTRY_CONTRACT) throw new Error("EVENT_REGISTRY_CONTRACT not set");

  const { address, contractName } = parseContractId(EVENT_REGISTRY_CONTRACT);

  const tx = await makeContractCall({
    contractAddress: address,
    contractName,
    functionName: "create-event",
    functionArgs: [
      stringUtf8CV(params.title),
      stringUtf8CV(params.description),
      stringAsciiCV(params.category),
      stringUtf8CV(params.location),
      stringUtf8CV(params.image),
      uintCV(params.eventDateUnix),
      uintCV(params.priceUstx),
      uintCV(params.ticketsTotal),
    ],
    senderKey: DEPLOYER_KEY,
    network: NETWORK,
  });

  const result = await broadcastTransaction({ transaction: tx, network: NETWORK });
  if ("error" in result) {
    throw new Error(`Broadcast failed: ${result.error}`);
  }

  // Return the txid; the actual on-chain event ID is in the tx receipt
  // We store the txid and let the caller handle parsing if needed
  return 0; // On-chain ID is not available until tx is mined
}

/**
 * Cancel an event on-chain via the event-registry contract.
 */
export async function cancelOnChainEvent(onChainEventId: number): Promise<string> {
  if (!DEPLOYER_KEY) throw new Error("STACKS_DEPLOYER_KEY not set");
  if (!EVENT_REGISTRY_CONTRACT) throw new Error("EVENT_REGISTRY_CONTRACT not set");

  const { address, contractName } = parseContractId(EVENT_REGISTRY_CONTRACT);

  const tx = await makeContractCall({
    contractAddress: address,
    contractName,
    functionName: "cancel-event",
    functionArgs: [uintCV(onChainEventId)],
    senderKey: DEPLOYER_KEY,
    network: NETWORK,
  });

  const result = await broadcastTransaction({ transaction: tx, network: NETWORK });
  if ("error" in result) {
    throw new Error(`Broadcast failed: ${result.error}`);
  }

  return result.txid;
}
