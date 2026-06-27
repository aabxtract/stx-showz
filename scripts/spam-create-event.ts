/**
 * Mainnet contract interaction script.
 *
 * Generates 100 fresh wallets, funds each with 0.002 STX from the deployer,
 * then has each wallet call `create-event` on event-registry once.
 *
 * Run:
 *   DEPLOYER_MNEMONIC="word1 word2 ..." npx tsx scripts/spam-create-event.ts
 *
 * Generated wallets are written to scripts/generated-wallets.json so you can
 * recover funds afterwards. KEEP THAT FILE SAFE.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  PostConditionMode,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeSTXTokenTransfer,
  makeContractCall,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
} from "@stacks/transactions";
import { generateSecretKey, generateWallet } from "@stacks/wallet-sdk";

const NETWORK = "mainnet" as const;
const CONTRACT_ADDRESS = "SP3JRJTXR5JS74DKHW9EHEB4WB7B0MMZ3X9SBD3FJ";
const CONTRACT_NAME = "event-registry";
const FUNCTION_NAME = "create-event";

const NUM_WALLETS = 100;
const CALLS_PER_WALLET = 1;
const FUND_AMOUNT_USTX = 2_000n;  // 0.002 STX (covers 1 call @ 0.002 STX)
const FUND_FEE_USTX = 6_000n;     // 0.006 STX per transfer (bumped to confirm in 1-2 blocks)
const CALL_FEE_USTX = 2_000n;     // 0.002 STX per contract call
const FUND_BATCH_SIZE = 22;       // Stacks mempool chaining limit is ~25 unconfirmed txs per sender

const WALLET_FILE = path.join(__dirname, "generated-wallets.json");

type Wallet = { mnemonic: string; privateKey: string; address: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAccountWithRetry(address: string): Promise<{ nonce: number; balance: string } | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(`https://api.hiro.so/v2/accounts/${address}?proof=0`);
      if (res.ok) return (await res.json()) as { nonce: number; balance: string };
      const backoff = 2000 * (attempt + 1);
      console.warn(`  [retry ${attempt + 1}] fetch failed for ${address} with status ${res.status}. Backing off ${backoff}ms...`);
      await sleep(backoff);
    } catch (err: any) {
      const backoff = 2000 * (attempt + 1);
      console.warn(`  [retry ${attempt + 1}] fetch threw error for ${address}: ${err.message}. Backing off ${backoff}ms...`);
      await sleep(backoff);
    }
  }
  return null;
}

async function getNonce(address: string): Promise<number> {
  const data = await fetchAccountWithRetry(address);
  if (!data) throw new Error(`nonce fetch failed for ${address} after retries`);
  return data.nonce;
}

async function getBalanceUstx(address: string): Promise<bigint> {
  const data = await fetchAccountWithRetry(address);
  if (!data) return 0n;
  try {
    return BigInt(data.balance);
  } catch {
    return 0n;
  }
}

async function waitForTx(txid: string, label: string): Promise<string> {
  const clean = txid.startsWith("0x") ? txid : "0x" + txid;
  const url = `https://api.hiro.so/extended/v1/tx/${clean}`;
  for (let i = 0; i < 90; i++) {
    const res = await fetch(url);
    if (res.ok) {
      const tx = (await res.json()) as { tx_status?: string };
      if (tx.tx_status && tx.tx_status !== "pending") return tx.tx_status;
    }
    await sleep(10_000);
  }
  return "timeout";
}

async function generateWallets(count: number): Promise<Wallet[]> {
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

async function fundWallets(deployerKey: string, deployerAddress: string, wallets: Wallet[]) {
  console.log(`Checking which of ${wallets.length} wallets already have balance...`);
  const needsFunding: Wallet[] = [];
  for (const w of wallets) {
    const bal = await getBalanceUstx(w.address);
    if (bal >= FUND_AMOUNT_USTX) {
      // already funded
    } else {
      needsFunding.push(w);
    }
    await sleep(400); // pace RPC to avoid 429s
  }
  console.log(`${wallets.length - needsFunding.length} already funded, ${needsFunding.length} need funding.`);

  if (needsFunding.length === 0) {
    console.log("All wallets already funded. Skipping funding step.");
    return;
  }

  const batches: Wallet[][] = [];
  for (let i = 0; i < needsFunding.length; i += FUND_BATCH_SIZE) {
    batches.push(needsFunding.slice(i, i + FUND_BATCH_SIZE));
  }
  console.log(`Splitting into ${batches.length} batch(es) of up to ${FUND_BATCH_SIZE} (mempool chaining limit).`);

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    let nonce = await getNonce(deployerAddress);
    console.log(`\nBatch ${b + 1}/${batches.length} (${batch.length} wallets, deployer nonce ${nonce})`);
    const batchTxids: string[] = [];

    for (let i = 0; i < batch.length; i++) {
      const w = batch[i];
      const tx = await makeSTXTokenTransfer({
        recipient: w.address,
        amount: FUND_AMOUNT_USTX,
        senderKey: deployerKey,
        network: NETWORK,
        memo: "stx-showz funding",
        nonce,
        fee: FUND_FEE_USTX,
      });

      const txid = await broadcastWithRetry(tx, `b${b + 1}/f${i} ${w.address}`);
      if (!txid) {
        throw new Error(`Batch ${b + 1} failed at index ${i} (${w.address}). Re-run to resume.`);
      }
      console.log(`  funded ${w.address} -> ${txid}`);
      batchTxids.push(txid);
      nonce++;
      await sleep(500); // pace public RPC
    }

    console.log(`Batch ${b + 1} broadcast complete. Waiting for last tx to confirm (~10 min)...`);
    const status = await waitForTx(batchTxids[batchTxids.length - 1], `batch ${b + 1} final tx`);
    console.log(`Batch ${b + 1} final tx status: ${status}`);
    if (status !== "success") {
      throw new Error(`Batch ${b + 1} did not confirm cleanly: ${status}`);
    }
  }

  console.log(`\nAll ${batches.length} funding batch(es) confirmed.`);
}

function buildCreateEventArgs(walletIndex: number, callIndex: number) {
  const eventDate = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  return [
    stringUtf8CV(`Showz event ${walletIndex}-${callIndex}`),
    stringUtf8CV(`Auto-generated event from wallet ${walletIndex}, call ${callIndex}.`),
    stringAsciiCV("general"),
    stringUtf8CV("Online"),
    stringUtf8CV("https://stx-showz.example/placeholder.png"),
    uintCV(eventDate),
    uintCV(1_000_000),
    uintCV(100),
  ];
}

async function broadcastWithRetry(tx: any, label: string): Promise<string | null> {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const result = await broadcastTransaction({ transaction: tx, network: NETWORK });
      if ((result as any).error) {
        console.error(`  ${label} broadcast error: ${JSON.stringify(result)}`);
        return null;
      }
      return (result as any).txid;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const backoff = 5000 * (attempt + 1);
      console.warn(`  ${label} attempt ${attempt + 1} failed (${msg.slice(0, 80)}). Backing off ${backoff}ms`);
      await sleep(backoff);
    }
  }
  return null;
}

async function spamFromWallet(w: Wallet, walletIndex: number): Promise<string[]> {
  let nonce = await getNonce(w.address);
  const txids: string[] = [];
  for (let i = 0; i < CALLS_PER_WALLET; i++) {
    const tx = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: FUNCTION_NAME,
      functionArgs: buildCreateEventArgs(walletIndex, nonce),
      senderKey: w.privateKey,
      network: NETWORK,
      nonce,
      fee: CALL_FEE_USTX,
      postConditionMode: PostConditionMode.Allow,
    });
    const txid = await broadcastWithRetry(tx, `w${walletIndex}/c${nonce}`);
    if (!txid) break;
    txids.push(txid);
    nonce++;
    await sleep(1500); // be polite to public RPC
  }
  return txids;
}

async function main() {
  const deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
  if (!deployerMnemonic) {
    throw new Error("Set DEPLOYER_MNEMONIC env var to the funding wallet mnemonic.");
  }

  const deployerWallet = await generateWallet({ secretKey: deployerMnemonic, password: "" });
  const deployerKey = deployerWallet.accounts[0].stxPrivateKey;
  const deployerAddress = getAddressFromPrivateKey(deployerKey, NETWORK);
  console.log(`Deployer/funder: ${deployerAddress}`);

  let wallets: Wallet[];
  if (fs.existsSync(WALLET_FILE)) {
    wallets = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8"));
    console.log(`Loaded ${wallets.length} wallets from ${WALLET_FILE}`);
  } else {
    console.log(`Generating ${NUM_WALLETS} new wallets...`);
    wallets = await generateWallets(NUM_WALLETS);
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
    console.log(`Wrote ${WALLET_FILE}`);
  }

  if (process.env.SKIP_FUND !== "1") {
    await fundWallets(deployerKey, deployerAddress, wallets);
  } else {
    console.log("SKIP_FUND=1 set — skipping funding step");
  }

  if (process.env.FUND_ONLY === "1") {
    console.log("FUND_ONLY=1 set — funding complete, exiting before contract calls.");
    console.log(`Next step: re-run with SKIP_FUND=1 to broadcast the ${CALLS_PER_WALLET} calls per wallet (new wallets will be generated).`);
    return;
  }

  console.log(`Spamming create-event from ${NUM_WALLETS} wallets x ${CALLS_PER_WALLET} calls each...`);
  const allTxids: Record<string, string[]> = {};
  for (let i = 0; i < wallets.length; i++) {
    const w = wallets[i];
    console.log(`  wallet ${i} (${w.address}) sending ${CALLS_PER_WALLET} calls...`);
    try {
      const txids = await spamFromWallet(w, i);
      allTxids[w.address] = txids;
      console.log(`    sent ${txids.length} txs`);
    } catch (err: any) {
      console.error(`    Error spamming from wallet ${i} (${w.address}): ${err.message}`);
    }
  }

  const logFile = path.join(__dirname, `spam-log-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(allTxids, null, 2));
  const total = Object.values(allTxids).reduce((s, a) => s + a.length, 0);
  console.log(`Done. Broadcast ${total} txs across ${wallets.length} wallets. Log: ${logFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
