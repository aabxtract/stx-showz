/**
 * Server-side Stacks transaction broadcasting.
 * Used for minting VTX tokens on-chain.
 */
import {
  makeContractCall,
  broadcastTransaction,
  standardPrincipalCV,
  uintCV,
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
