import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { mintTokens } from "@/lib/stacks-tx";

const Body = z.object({
  eventId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rewardConfig: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find all checked-in attendees who haven't received a reward yet
  const validTickets = await prisma.ticket.findMany({
    where: { eventId, status: "Valid" },
    include: { owner: { select: { id: true, address: true } } },
  });

  const existingDisbursements = await prisma.disbursement.findMany({
    where: { eventId, txStatus: { not: "failed" } },
    select: { userId: true },
  });
  const alreadyRewarded = new Set(existingDisbursements.map((d) => d.userId));

  const pendingTickets = validTickets.filter((t) => !alreadyRewarded.has(t.ownerId));

  const amount = event.rewardConfig?.tokenPerCheckin ?? 100;
  const network = process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet";

  const disbursements: Awaited<ReturnType<typeof prisma.disbursement.create>>[] = [];

  for (const ticket of pendingTickets) {
    const disbursement = await prisma.disbursement.create({
      data: {
        userId: session.userId,
        eventId,
        amount,
        network,
        type: "event_reward",
      },
    });

    try {
      const txId = await mintTokens(ticket.owner.address, amount);
      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: { txId, txStatus: "pending" },
      });
      disbursements.push({ ...disbursement, txId, txStatus: "pending" });
    } catch {
      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: { txStatus: "failed" },
      });
      disbursements.push({ ...disbursement, txStatus: "failed" });
    }
  }

  return NextResponse.json({ disbursements }, { status: 201 });
}
