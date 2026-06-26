import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { organizer: { select: { address: true, name: true } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: serializeEvent(event) });
}

const CATEGORIES = ["Music", "Tech", "Sports", "Art", "Conference", "Workshop"] as const;
const NETWORKS = ["stacks", "bitcoin"] as const;

const UpdateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.enum(CATEGORIES).optional(),
  date: z.string().datetime().optional(),
  location: z.string().min(1).max(300).optional(),
  image: z.string().url().optional(),
  network: z.enum(NETWORKS).optional(),
  ticketsTotal: z.number().int().positive().max(1_000_000).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = UpdateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (data.ticketsTotal !== undefined && data.ticketsTotal < existing.ticketsSold) {
    return NextResponse.json(
      { error: "ticketsTotal cannot be less than ticketsSold" },
      { status: 400 },
    );
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
    include: { organizer: { select: { address: true, name: true } } },
  });

  return NextResponse.json({ event: serializeEvent(event) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: { status: "Cancelled" },
    include: { organizer: { select: { address: true, name: true } } },
  });

  return NextResponse.json({ event: serializeEvent(event) });
}
