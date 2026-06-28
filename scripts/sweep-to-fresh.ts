/**
 * Sweep funds from old wallets into fresh wallets.
 *
 * Reads old wallets from generated-wallets.json, generates fresh wallets,
 * and transfers all remaining STX from each old wallet to a new wallet
 * (round-robin distribution).
 *
 * Run:
 *   npx tsx scripts/sweep-to-fresh.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
} from "@stacks/transactions";
import { generateSecretKey, generateWallet } from "@stacks/wallet-sdk";

const NETWORK = "mainnet" as const;
const NEW_WALLET_COUNT = 97;
const FEE_USTX = 3_000n; // 0.003 STX fee per transfer
const BATCH_SIZE = 22;
const WALLET_FILE = path.join(__dirname, "generated-wallets.json");
const NEW_WALLET_FILE = path.join(__dirname, "generated-wallets-fresh.json");

type Wallet = { mnemonic: string; privateKey: string; address: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchBalance(address: string): Promise<bigint> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`https://api.hiro.so/v2/accounts/${address}?proof=0`);
      if (res.ok) {
        const data = (await res.json()) as { balance: string };
        return BigInt(data.balance);
      }
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return 0n;
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  return 0n;
}

async function fetchNonce(address: string): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`https://api.hiro.so/v2/accounts/${address}?proof=0`);
      if (res.ok) {
        const data = (await res.json()) as { nonce: number };
        return data.nonce;
      }
      await sleep(2000 * (attempt + 1));
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error(`nonce fetch failed for ${address}`);
}

async function broadcastWithRetry(tx: any, label: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await broadcastTransaction({ transaction: tx, network: NETWORK });
      if ("error" in result) {
        console.error(`  ${label} broadcast error: ${JSON.stringify(result)}`);
        return null;
      }
      return result.txid;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const backoff = 3000 * (attempt + 1);
      console.warn(`  ${label} attempt ${attempt + 1} failed (${msg.slice(0, 80)}). Backing off ${backoff}ms`);
      await sleep(backoff);
    }
  }
  return null;
}

async function generateFreshWallets(count: number): Promise<Wallet[]> {
  const wallets: Wallet[] = [];
  for (let i = 0; i < count; i++) {
    const mnemonic = generateSecretKey(256);
    const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
    const account = wallet.accounts[0];
    const privateKey = account.stxPrivateKey;
    const address = getAddressFromPrivateKey(privateKey, NETWORK);
    wallets.push({ mnemonic, privateKey, address });
  }
  return wallets;
}

async function main() {
  // Load old wallets
  if (!fs.existsSync(WALLET_FILE)) {
    console.error(`No wallet file found at ${WALLET_FILE}`);
    process.exit(1);
  }
  const oldWallets: Wallet[] = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8"));
  console.log(`Loaded ${oldWallets.length} old wallets`);

  // Generate fresh wallets
  console.log(`Generating ${NEW_WALLET_COUNT} fresh wallets...`);
  const newWallets = await generateFreshWallets(NEW_WALLET_COUNT);
  fs.writeFileSync(NEW_WALLET_FILE, JSON.stringify(newWallets, null, 2));
  console.log(`Wrote ${NEW_WALLET_FILE}`);

  // Check balances of old wallets
  console.log(`\nChecking balances of ${oldWallets.length} old wallets...`);
  const fundedOld: { wallet: Wallet; balance: bigint; nonce: number }[] = [];
  for (let i = 0; i < oldWallets.length; i++) {
    const w = oldWallets[i];
    const [balance, nonce] = await Promise.all([fetchBalance(w.address), fetchNonce(w.address)]);
    const minBalance = FEE_USTX + 1n; // need at least fee + 1 uSTX
    if (balance >= minBalance) {
      fundedOld.push({ wallet: w, balance, nonce });
      console.log(`  [${i}] ${w.address}  bal=${(balance / 1_000_000n).toString()}.${((balance % 1_000_000n).toString().padStart(6, "0"))} STX  ✓`);
    } else {
      console.log(`  [${i}] ${w.address}  bal=${balance} uSTX  (skip - insufficient)`);
    }
    await sleep(400);
  }

  console.log(`\n${fundedOld.length} wallets have funds to sweep`);

  if (fundedOld.length === 0) {
    console.log("Nothing to sweep.");
    return;
  }

  // Map old wallets to new wallets (round-robin)
  const transfers: { from: Wallet; to: Wallet; amount: bigint; nonce: number }[] = [];
  for (let i = 0; i < fundedOld.length; i++) {
    const { wallet: from, balance, nonce } = fundedOld[i];
    const to = newWallets[i % NEW_WALLET_COUNT];
    const sendAmount = balance - FEE_USTX;
    if (sendAmount > 0n) {
      transfers.push({ from, to, amount: sendAmount, nonce });
    }
  }

  console.log(`\nBroadcasting ${transfers.length} transfers...`);

  // Broadcast in batches
  const batches: typeof transfers[] = [];
  for (let i = 0; i < transfers.length; i += BATCH_SIZE) {
    batches.push(transfers.slice(i, i + BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`\nBatch ${b + 1}/${batches.length} (${batch.length} transfers)`);

    for (let i = 0; i < batch.length; i++) {
      const { from, to, amount, nonce } = batch[i];
      const tx = await makeSTXTokenTransfer({
        recipient: to.address,
        amount,
        senderKey: from.privateKey,
        network: NETWORK,
        memo: "sweep to fresh",
        nonce,
        fee: FEE_USTX,
      });

      const txid = await broadcastWithRetry(tx, `sweep ${from.address.slice(0, 12)}...`);
      if (txid) {
        console.log(`  ${from.address} -> ${to.address}  (${amount} uSTX)  ${txid}`);
        totalSuccess++;
      } else {
        totalFailed++;
      }
      await sleep(500);
    }
  }

  console.log(`\nDone. ${totalSuccess} succeeded, ${totalFailed} failed.`);
  console.log(`Fresh wallets saved to ${NEW_WALLET_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
