import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          image: true,
          status: true,
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      eventId: ticket.eventId,
      eventTitle: ticket.event.title,
      eventDate: ticket.event.date.toISOString(),
      location: ticket.event.location,
      image: ticket.event.image,
      eventStatus: ticket.event.status,
      txId: ticket.txId,
      txStatus: ticket.txStatus,
      amountStx: ticket.amountStx.toString(),
      network: ticket.network,
      status: ticket.status,
      usedAt: ticket.usedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
    },
  });
}
