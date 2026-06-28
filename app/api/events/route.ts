import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const CATEGORIES = ["Music", "Tech", "Sports", "Art", "Conference", "Workshop"] as const;
const STATUSES = ["Active", "SoldOut", "Cancelled", "Ended"] as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const organizerAddress = url.searchParams.get("organizer");
  const q = url.searchParams.get("q");
  const take = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);
  const skip = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const where: Prisma.EventWhereInput = {};
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    where.category = category as (typeof CATEGORIES)[number];
  }
  if (status && (STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof STATUSES)[number];
  }
  if (organizerAddress) {
    where.organizer = { address: organizerAddress };
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      take,
      skip,
      include: { organizer: { select: { address: true, name: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({
    events: events.map(serializeEvent),
    total,
    limit: take,
    offset: skip,
  });
}

const NETWORKS = ["stacks", "bitcoin"] as const;

const CreateBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(CATEGORIES),
  date: z.string().datetime(),
  location: z.string().min(1).max(300),
  image: z.string().url(),
  price: z.union([z.string(), z.number()]).transform((v) => v.toString()),
  network: z.enum(NETWORKS).default("stacks"),
  ticketsTotal: z.number().int().positive().max(1_000_000),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`events:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  let priceDecimal: Prisma.Decimal;
  try {
    priceDecimal = new Prisma.Decimal(data.price);
  } catch {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  if (priceDecimal.isNegative()) {
    return NextResponse.json({ error: "Price must be non-negative" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      date: new Date(data.date),
      location: data.location,
      image: data.image,
      price: priceDecimal,
      network: data.network,
      ticketsTotal: data.ticketsTotal,
      organizerId: session.userId,
    },
    include: { organizer: { select: { address: true, name: true } } },
  });

  return NextResponse.json({ event: serializeEvent(event) }, { status: 201 });
}
