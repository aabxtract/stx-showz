import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { shortAddr } from "@/lib/utils";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [createdEvents, purchases, checkIns] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.ticket.findMany({
      where: { event: { organizerId: session.userId }, status: { in: ["Valid", "Used"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        owner: { select: { address: true } },
        event: { select: { title: true } },
      },
    }),
    prisma.ticket.findMany({
      where: { event: { organizerId: session.userId }, status: "Used" },
      orderBy: { usedAt: "desc" },
      take: 20,
      select: {
        id: true,
        usedAt: true,
        event: { select: { title: true } },
      },
    }),
  ]);

  const items = [
    ...createdEvents.map((e) => ({
      id: `create-${e.id}`,
      type: "create" as const,
      label: `You created the event '${e.title}'`,
      timestamp: e.createdAt.toISOString(),
    })),
    ...purchases.map((t) => ({
      id: `purchase-${t.id}`,
      type: "purchase" as const,
      label: `${shortAddr(t.owner.address)} bought a ticket to ${t.event.title}`,
      timestamp: t.createdAt.toISOString(),
    })),
    ...checkIns
      .filter((t) => t.usedAt)
      .map((t) => ({
        id: `verify-${t.id}`,
        type: "verify" as const,
        label: `You verified ticket ${t.id.slice(0, 8)} at ${t.event.title}`,
        timestamp: t.usedAt!.toISOString(),
      })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 30);

  return NextResponse.json({ activity: items });
}

function shortAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
