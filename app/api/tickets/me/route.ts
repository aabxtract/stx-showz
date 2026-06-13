import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.ticket.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: {
        select: { id: true, title: true, date: true, location: true, image: true, status: true },
      },
    },
  });

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      eventId: t.eventId,
      eventTitle: t.event.title,
      eventDate: t.event.date.toISOString(),
      location: t.event.location,
      image: t.event.image,
      eventStatus: t.event.status,
      txId: t.txId,
      txStatus: t.txStatus,
      amountStx: t.amountStx.toString(),
      network: t.network,
      status: t.status,
      usedAt: t.usedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
