import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { mintTokens } from "@/lib/stacks-tx";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const Body = z.object({
  eventId: z.string().min(1),
  attendeeAddress: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`disburse:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId, attendeeAddress } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true, rewardConfig: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.organizerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify recipient actually attended
  const ticket = await prisma.ticket.findFirst({
    where: { eventId, owner: { address: attendeeAddress }, status: "Valid" },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Attendee has no valid ticket for this event" }, { status: 400 });
  }

  const amount = event.rewardConfig?.tokenPerCheckin ?? 100;
  const network = process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet";

  // Create disbursement record
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
    const txId = await mintTokens(attendeeAddress, amount);
    const updated = await prisma.disbursement.update({
      where: { id: disbursement.id },
      data: { txId, txStatus: "pending" },
    });
    return NextResponse.json({ disbursement: updated, txId }, { status: 201 });
  } catch (err) {
    await prisma.disbursement.update({
      where: { id: disbursement.id },
      data: { txStatus: "failed" },
    });
    return NextResponse.json(
      { error: `Mint failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
