import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { buildSignInMessage } from "@/lib/siwsMessage";

const Body = z.object({
  address: z.string().min(20).max(64),
});

const NONCE_TTL_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const { address } = parsed.data;
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.nonce.upsert({
    where: { address },
    update: { nonce, expiresAt },
    create: { address, nonce, expiresAt },
  });

  const issuedAt = new Date().toISOString();
  const message = buildSignInMessage({ address, nonce, issuedAt });

  return NextResponse.json({ nonce, message, issuedAt });
}
