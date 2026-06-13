import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { organizerId: session.userId },
    orderBy: { date: "asc" },
    include: { organizer: { select: { address: true, name: true } } },
  });

  return NextResponse.json({
    events: events.map((evt) => ({
      ...serializeEvent(evt),
      revenue: new Prisma.Decimal(evt.price).mul(evt.ticketsSold).toString(),
    })),
  });
}
