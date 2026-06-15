import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, organizerId: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { eventId: params.id, status: { in: ["Valid", "Used"] } },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { address: true } } },
  });

  return NextResponse.json({
    eventId: event.id,
    eventTitle: event.title,
    attendees: tickets.map((t) => ({
      wallet: t.owner.address,
      ticketId: t.id,
      purchasedAt: t.createdAt.toISOString(),
      checkedIn: t.status === "Used",
      checkedInAt: t.usedAt?.toISOString() ?? null,
    })),
  });
}
