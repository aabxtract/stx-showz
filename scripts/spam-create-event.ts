/**
 * Mainnet contract interaction script.
 *
 * Generates 20 fresh wallets, funds each with 0.03 STX from the deployer,
 * then has each wallet call `create-event` on event-registry 10 times.
 *
 * Run:
 *   DEPLOYER_MNEMONIC="word1 word2 ..." npx tsx scripts/spam-create-event.ts
 *
 * Generated wallets are written to scripts/generated-wallets.json so you can
 * recover funds afterwards. KEEP THAT FILE SAFE.
 */

import fs from "node:fs";
import path from "node:path";
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

const NUM_WALLETS = 20;
const CALLS_PER_WALLET = 10;
const FUND_AMOUNT_USTX = 30_000n; // 0.03 STX
const FUND_FEE_USTX = 3_000n;     // 0.003 STX per transfer
const CALL_FEE_USTX = 2_000n;     // 0.002 STX per contract call

const WALLET_FILE = path.join(__dirname, "generated-wallets.json");

type Wallet = { mnemonic: string; privateKey: string; address: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getNonce(address: string): Promise<number> {
  const res = await fetch(`https://api.hiro.so/v2/accounts/${address}?proof=0`);
  if (!res.ok) throw new Error(`nonce fetch failed for ${address}: ${res.status}`);
  const data = (await res.json()) as { nonce: number };
  return data.nonce;
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
  let nonce = await getNonce(deployerAddress);
  console.log(`Funding from ${deployerAddress} (starting nonce ${nonce})`);
  const txids: string[] = [];

  for (const w of wallets) {
    const tx = await makeSTXTokenTransfer({
      recipient: w.address,
      amount: FUND_AMOUNT_USTX,
      senderKey: deployerKey,
      network: NETWORK,
      memo: "stx-showz funding",
      nonce,
      fee: FUND_FEE_USTX,
    });
    const result = await broadcastTransaction({ transaction: tx, network: NETWORK });
    if ((result as any).error) throw new Error(`fund broadcast failed: ${JSON.stringify(result)}`);
    console.log(`  funded ${w.address} -> ${(result as any).txid}`);
    txids.push((result as any).txid);
    nonce++;
  }

  console.log("Waiting for last funding tx to confirm (this can take ~10 minutes)...");
  const status = await waitForTx(txids[txids.length - 1], "final funding tx");
  console.log(`Funding final tx status: ${status}`);
  if (status !== "success") {
    throw new Error(`Funding did not confirm cleanly: ${status}`);
  }
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
  const remaining = CALLS_PER_WALLET - nonce;
  const txids: string[] = [];
  if (remaining <= 0) {
    console.log(`    wallet ${walletIndex} already at nonce ${nonce}, skipping`);
    return txids;
  }
  for (let i = nonce; i < CALLS_PER_WALLET; i++) {
    const tx = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: FUNCTION_NAME,
      functionArgs: buildCreateEventArgs(walletIndex, i),
      senderKey: w.privateKey,
      network: NETWORK,
      nonce,
      fee: CALL_FEE_USTX,
      postConditionMode: PostConditionMode.Allow,
    });
    const txid = await broadcastWithRetry(tx, `w${walletIndex}/c${i}`);
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
  if (process.env.RESUME === "1" && fs.existsSync(WALLET_FILE)) {
    wallets = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8"));
    console.log(`Resume mode: loaded ${wallets.length} wallets from ${WALLET_FILE}`);
  } else {
    console.log(`Generating ${NUM_WALLETS} wallets...`);
    wallets = await generateWallets(NUM_WALLETS);
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
    console.log(`Wrote ${WALLET_FILE}`);
  }

  if (process.env.SKIP_FUND !== "1") {
    await fundWallets(deployerKey, deployerAddress, wallets);
  } else {
    console.log("SKIP_FUND=1 set — skipping funding step");
  }

  console.log(`Spamming create-event from ${NUM_WALLETS} wallets x ${CALLS_PER_WALLET} calls each...`);
  const allTxids: Record<string, string[]> = {};
  for (let i = 0; i < wallets.length; i++) {
    const w = wallets[i];
    console.log(`  wallet ${i} (${w.address}) sending ${CALLS_PER_WALLET} calls...`);
    const txids = await spamFromWallet(w, i);
    allTxids[w.address] = txids;
    console.log(`    sent ${txids.length} txs`);
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
