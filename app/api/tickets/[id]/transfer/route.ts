import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendTransferNotification } from "@/lib/email";

type Ctx = { params: { id: string } };

const Body = z.object({
  toAddress: z.string().min(1),
});

export async function POST(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { event: { select: { status: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (ticket.status !== "Valid") {
    return NextResponse.json({ error: `Ticket is ${ticket.status} and cannot be transferred` }, { status: 400 });
  }
  if (ticket.event.status === "Ended" || ticket.event.status === "Cancelled") {
    return NextResponse.json({ error: "Event has ended or been cancelled" }, { status: 400 });
  }

  // Find or create recipient user
  const { toAddress } = parsed.data;
  const recipient = await prisma.user.upsert({
    where: { address: toAddress },
    update: {},
    create: { address: toAddress },
  });

  // Transfer: reassign ownership
  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: { ownerId: recipient.id },
  });

  // Send transfer notification email in background
  const sender = await prisma.user.findUnique({ where: { id: session.userId }, select: { address: true } });
  if (sender) {
    const event = await prisma.event.findUnique({ where: { id: ticket.eventId }, select: { title: true } });
    sendTransferNotification({
      to: toAddress,
      eventTitle: event?.title ?? "Event",
      ticketId: params.id,
      fromAddress: sender.address,
    }).catch(() => {});
  }

  return NextResponse.json({
    ticket: {
      id: updated.id,
      ownerId: updated.ownerId,
      status: updated.status,
    },
    message: `Ticket transferred to ${toAddress}`,
  });
}
