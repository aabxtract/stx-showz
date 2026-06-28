import { prisma } from "./prisma";

/**
 * Simple IP-based rate limiter using the RateLimit model.
 * Returns true if the request should be rejected (rate limited).
 */
export async function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowStart < windowStart) {
      await tx.rateLimit.upsert({
        where: { key },
        update: { count: 1, windowStart: now },
        create: { key, count: 1, windowStart: now },
      });
      return false;
    }

    if (existing.count >= maxRequests) return true;

    await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return false;
  });

  return result;
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
