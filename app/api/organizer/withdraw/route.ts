import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withdrawStx } from "@/lib/stacks-tx";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const Body = z.object({
  eventId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).transform((v) => v.toString()),
  toAddress: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`withdraw:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId, amount, toAddress } = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Calculate available revenue: sum of confirmed ticket payments minus already withdrawn
  const paidTickets = await prisma.ticket.aggregate({
    where: { eventId, txStatus: "confirmed" },
    _sum: { amountStx: true },
  });
  const totalPaid = paidTickets._sum.amountStx ?? new Prisma.Decimal(0);

  const previousWithdrawals = await prisma.withdrawal.aggregate({
    where: { eventId, txStatus: { in: ["pending", "confirmed"] } },
    _sum: { amount: true },
  });
  const totalWithdrawn = previousWithdrawals._sum.amount ?? new Prisma.Decimal(0);

  const available = totalPaid.sub(totalWithdrawn);
  const withdrawAmount = new Prisma.Decimal(amount);

  if (withdrawAmount.isNegative() || withdrawAmount.isZero()) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }
  if (withdrawAmount.gt(available)) {
    return NextResponse.json(
      { error: `Insufficient balance. Available: ${available.toString()} STX` },
      { status: 400 },
    );
  }

  const network = event.network === "bitcoin" ? "mainnet" : (process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet") as "mainnet" | "testnet";

  // Create withdrawal record
  const withdrawal = await prisma.withdrawal.create({
    data: {
      organizerId: session.userId,
      eventId,
      amount: withdrawAmount,
      toAddress,
      network,
    },
  });

  try {
    const amountUstx = withdrawAmount.mul(1_000_000).toNumber();
    const txId = await withdrawStx({ toAddress, amountUstx, network });
    const updated = await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { txId, txStatus: "pending" },
    });
    return NextResponse.json({ withdrawal: updated }, { status: 201 });
  } catch (err) {
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { txStatus: "failed" },
    });
    return NextResponse.json(
      { error: `Withdrawal failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");

  const where: Prisma.WithdrawalWhereInput = { organizerId: session.userId };
  if (eventId) where.eventId = eventId;

  const withdrawals = await prisma.withdrawal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { event: { select: { id: true, title: true } } },
  });

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount.toString(),
      toAddress: w.toAddress,
      txId: w.txId,
      txStatus: w.txStatus,
      network: w.network,
      event: w.event,
      createdAt: w.createdAt.toISOString(),
    })),
  });
}
