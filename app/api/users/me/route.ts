import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const Body = z.object({
  name: z.string().min(1).max(80).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`profile:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: parsed.data,
    select: { id: true, address: true, name: true, bio: true, avatarUrl: true },
  });

  return NextResponse.json({ user });
}
