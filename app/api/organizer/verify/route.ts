import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const Body = z.object({
  ticketId: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`verify:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    include: {
      event: { select: { id: true, title: true, organizerId: true } },
      owner: { select: { address: true } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.event.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (ticket.status === "Used") {
    return NextResponse.json(
      { error: "Already used", usedAt: ticket.usedAt?.toISOString() },
      { status: 409 },
    );
  }
  if (ticket.status !== "Valid") {
    return NextResponse.json({ error: `Ticket is ${ticket.status}` }, { status: 400 });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "Used", usedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    ticket: {
      id: updated.id,
      status: updated.status,
      usedAt: updated.usedAt?.toISOString(),
      eventTitle: ticket.event.title,
      ownerAddress: ticket.owner.address,
    },
  });
}
