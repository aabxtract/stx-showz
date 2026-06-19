import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { buildSignInMessage } from "@/lib/siwsMessage";

const Body = z.object({
  address: z.string().min(20).max(64),
});

const NONCE_TTL_MS = 5 * 60 * 1000;
const MIN_REISSUE_INTERVAL_MS = 10_000;
const IP_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 10;

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function ipRateLimited(ip: string): Promise<boolean> {
  const key = `nonce:${ip}`;
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - IP_WINDOW_MS);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowStart < windowCutoff) {
      await tx.rateLimit.upsert({
        where: { key },
        update: { count: 1, windowStart: now },
        create: { key, count: 1, windowStart: now },
      });
      return false;
    }

    if (existing.count >= IP_MAX_REQUESTS) return true;

    await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return false;
  });

  return result;
}

async function cleanupExpired() {
  const now = new Date();
  const rateCutoff = new Date(now.getTime() - IP_WINDOW_MS * 5);
  await Promise.all([
    prisma.nonce.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimit.deleteMany({ where: { windowStart: { lt: rateCutoff } } }),
  ]).catch(() => {});
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await ipRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (Math.random() < 0.05) {
    void cleanupExpired();
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const { address } = parsed.data;

  const existing = await prisma.nonce.findUnique({ where: { address } });
  if (existing) {
    const issuedAtMs = existing.expiresAt.getTime() - NONCE_TTL_MS;
    if (Date.now() - issuedAtMs < MIN_REISSUE_INTERVAL_MS) {
      return NextResponse.json(
        { error: "Nonce was recently issued; please wait before retrying." },
        { status: 429 },
      );
    }
  }

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
