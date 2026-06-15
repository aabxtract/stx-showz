import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyMessageSignatureRsv } from "@stacks/encryption";
import { getAddressFromPublicKey } from "@stacks/transactions";
import { prisma } from "@/lib/prisma";
import { buildSignInMessage } from "@/lib/siwsMessage";
import { signSession, setSessionCookie } from "@/lib/auth";

const Body = z.object({
  address: z.string().min(20).max(64),
  publicKey: z.string().min(1),
  signature: z.string().min(1),
  issuedAt: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { address, publicKey, signature, issuedAt } = parsed.data;

  const record = await prisma.nonce.findUnique({ where: { address } });
  if (!record) {
    return NextResponse.json({ error: "Nonce not found" }, { status: 400 });
  }
  if (record.expiresAt < new Date()) {
    await prisma.nonce.delete({ where: { address } }).catch(() => {});
    return NextResponse.json({ error: "Nonce expired" }, { status: 400 });
  }

  const message = buildSignInMessage({ address, nonce: record.nonce, issuedAt });

  const devBypass = process.env.DEV_AUTH_BYPASS === "true";

  if (!devBypass) {
    const network = process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet";

    const derivedAddress = getAddressFromPublicKey(publicKey, network);
    if (derivedAddress !== address) {
      return NextResponse.json({ error: "Address does not match public key" }, { status: 401 });
    }

    const valid = verifyMessageSignatureRsv({ message, publicKey, signature });
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  await prisma.nonce.delete({ where: { address } }).catch(() => {});

  const user = await prisma.user.upsert({
    where: { address },
    update: {},
    create: { address },
  });

  const token = signSession({ userId: user.id, address: user.address });
  setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, address: user.address, name: user.name, avatarUrl: user.avatarUrl },
  });
}
