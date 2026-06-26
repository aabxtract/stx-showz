/**
 * Deploy the Veritix Token (VTX) SIP-010 contract to Stacks.
 *
 * Recommended: use Clarinet for deployment
 *   clarinet deployment apply -p deployments/default.testnet-plan.yaml
 *
 * Or with the Stacks CLI:
 *   stacks-node deploy contracts/veritix-token.clar --testnet
 *
 * This script is for programmatic deployment via @stacks/transactions.
 *
 * Usage:
 *   DEPLOYER_KEY=<hex-private-key> npx tsx scripts/deploy-token.ts testnet
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import {
  makeContractDeploy,
  broadcastTransaction,
} from "@stacks/transactions";

const NETWORK_ARG = process.argv[2] as "testnet" | "mainnet" | undefined;
const networkName = NETWORK_ARG ?? "testnet";
const deployerKey = process.env.DEPLOYER_KEY;

function getNetwork() {
  return networkName === "mainnet" ? new StacksMainnet() : new StacksTestnet();
}

async function main() {
  if (!deployerKey) {
    console.error("Set DEPLOYER_KEY env var (hex private key)");
    process.exit(1);
  }

  const network = getNetwork();

  const contractCode = readFileSync(
    resolve(__dirname, "../contracts/veritix-token.clar"),
    "utf-8",
  );

  console.log(`Deploying veritix-token to ${networkName}...`);

  const tx = await makeContractDeploy({
    contractName: "veritix-token",
    contractCode,
    fee: 50000,
    senderKey: deployerKey,
    network,
    anchorMode: 3,
  });

  const result = await broadcastTransaction(tx, network);
  console.log(`Broadcast result:`, JSON.stringify(result, null, 2));

  if (result.ok) {
    console.log(`\nTX ID: ${result.result}`);
    console.log(`Contract: ${result.result}.veritix-token`);
  } else {
    console.error(`Deploy failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
