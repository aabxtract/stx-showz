/**
 * Reads scripts/generated-wallets.json and prints balance + nonce
 * for each wallet, plus totals.
 *
 * Run: npx tsx scripts/check-balances.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Wallet = { mnemonic: string; privateKey: string; address: string };

const WALLET_FILE = path.join(__dirname, "generated-wallets.json");
const API = "https://api.hiro.so/v2/accounts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAccount(address: string): Promise<{ balance: bigint; nonce: number } | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`${API}/${address}?proof=0`);
      if (res.ok) {
        const data = (await res.json()) as { balance: string; nonce: number };
        return { balance: BigInt(data.balance), nonce: data.nonce };
      }
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return null;
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

function fmtStx(ustx: bigint): string {
  const whole = ustx / 1_000_000n;
  const frac = (ustx % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

async function main() {
  const wallets: Wallet[] = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8"));
  console.log(`Checking ${wallets.length} wallets...\n`);

  let total = 0n;
  let funded = 0;
  let empty = 0;
  const nonzero: { address: string; balance: bigint; nonce: number }[] = [];

  for (let i = 0; i < wallets.length; i++) {
    const w = wallets[i];
    const info = await fetchAccount(w.address);
    if (!info) {
      console.log(`  [${i.toString().padStart(3)}] ${w.address}  ERR`);
    } else {
      const stx = fmtStx(info.balance);
      const tag = info.balance > 0n ? "✓" : " ";
      console.log(
        `  ${tag} [${i.toString().padStart(3)}] ${w.address}  bal=${stx.padStart(10)} STX  nonce=${info.nonce}`,
      );
      total += info.balance;
      if (info.balance > 0n) {
        funded++;
        nonzero.push({ address: w.address, balance: info.balance, nonce: info.nonce });
      } else {
        empty++;
      }
    }
    await sleep(400);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Wallets:        ${wallets.length}`);
  console.log(`With balance:   ${funded}`);
  console.log(`Empty:          ${empty}`);
  console.log(`Total balance:  ${fmtStx(total)} STX  (${total} uSTX)`);
  if (nonzero.length > 0) {
    console.log(`\nNon-empty wallets recoverable: ${nonzero.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
