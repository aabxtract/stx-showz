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

const ipHits = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function ipRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (hits.length >= IP_MAX_REQUESTS) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (ipRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
