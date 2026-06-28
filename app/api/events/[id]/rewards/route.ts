import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Ctx = { params: { id: string } };

function serializeConfig(c: { id: string; eventId: string; tokenPerCheckin: number; createdAt: Date; updatedAt: Date }) {
  return {
    id: c.id,
    eventId: c.eventId,
    tokenPerCheckin: c.tokenPerCheckin,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET(_req: Request, { params }: Ctx) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, organizerId: true, rewardConfig: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    config: event.rewardConfig ? serializeConfig(event.rewardConfig) : null,
  });
}

const Body = z.object({
  tokenPerCheckin: z.number().int().min(0).max(1_000_000),
});

export async function POST(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const config = await prisma.rewardConfig.upsert({
    where: { eventId: params.id },
    update: { tokenPerCheckin: parsed.data.tokenPerCheckin },
    create: { eventId: params.id, tokenPerCheckin: parsed.data.tokenPerCheckin },
  });

  return NextResponse.json({ config: serializeConfig(config) });
}
