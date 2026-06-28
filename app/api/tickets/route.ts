import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyTicketPayment, type TxNetwork, type StacksNetwork } from "@/lib/hiro";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const Body = z.object({
  eventId: z.string().min(1),
  txId: z.string().min(1),
  network: z.enum(["testnet", "mainnet"]).optional(),
});

function serializeTicket(t: {
  id: string;
  eventId: string;
  ownerId: string;
  txId: string;
  txStatus: string;
  amountStx: { toString(): string };
  paidTo: string;
  network: string;
  status: string;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: t.id,
    eventId: t.eventId,
    ownerId: t.ownerId,
    txId: t.txId,
    txStatus: t.txStatus,
    amountStx: t.amountStx.toString(),
    paidTo: t.paidTo,
    network: t.network,
    status: t.status,
    usedAt: t.usedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (await isRateLimited(`tickets:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { eventId, txId } = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status !== "Active") {
    return NextResponse.json({ error: `Event is ${event.status}` }, { status: 400 });
  }

  // Use event's blockchain network for escrow lookup
  const network = event.network === "bitcoin" ? "mainnet" : (process.env.STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet") as StacksNetwork;

  const existing = await prisma.ticket.findUnique({ where: { txId } });
  if (existing && existing.ownerId !== session.userId) {
    return NextResponse.json({ error: "txId already used" }, { status: 409 });
  }
  if (existing && existing.eventId !== eventId) {
    return NextResponse.json(
      { error: "txId already used for a different event" },
      { status: 409 },
    );
  }

  const devBypass =
    process.env.NODE_ENV !== "production" && process.env.DEV_PAYMENT_BYPASS === "true";

  const escrow = (
    network === "mainnet"
      ? process.env.ESCROW_ADDRESS_MAINNET
      : process.env.ESCROW_ADDRESS_TESTNET
  )?.trim();

  if (!escrow && !devBypass) {
    console.error(
      `[tickets] Missing escrow address for network=${network}. ` +
      `Set ESCROW_ADDRESS_${network.toUpperCase()} before accepting purchases.`,
    );
    return NextResponse.json(
      { error: "Escrow wallet is not configured. Please contact support." },
      { status: 503 },
    );
  }

  const check = devBypass
    ? ({ ok: true, status: "confirmed", sender: session.address } as const)
    : await verifyTicketPayment({
      network: event.network as TxNetwork,
      txId,
      expectedPriceStx: event.price,
      buyerAddress: session.address,
    });

  if (!check.ok && check.status === "failed") {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  if (existing) {
    if (existing.status === "Valid") {
      return NextResponse.json({ ticket: serializeTicket(existing) });
    }
    if (check.ok) {
      const updated = await prisma.$transaction(async (tx) => {
        const flipped = await tx.ticket.updateMany({
          where: { txId, ownerId: session.userId, eventId, status: "Pending" },
          data: { status: "Valid", txStatus: "confirmed" },
        });
        if (flipped.count === 0) {
          // Another request already validated this ticket; report current state without double-incrementing.
          return tx.ticket.findUnique({ where: { txId } });
        }
        const incremented = await tx.event.updateMany({
          where: { id: eventId, ticketsSold: { lt: event.ticketsTotal } },
          data: { ticketsSold: { increment: 1 } },
        });
        if (incremented.count === 0) {
          throw new Error("SOLD_OUT");
        }
        // Auto-transition to SoldOut when all tickets are gone
        const refreshed = await tx.event.findUnique({ where: { id: eventId }, select: { ticketsSold: true, ticketsTotal: true } });
        if (refreshed && refreshed.ticketsSold >= refreshed.ticketsTotal) {
          await tx.event.updateMany({
            where: { id: eventId, status: "Active" },
            data: { status: "SoldOut" },
          });
        }
        return tx.ticket.findUnique({ where: { txId } });
      });
      if (!updated) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json({ ticket: serializeTicket(updated) });
    }
    return NextResponse.json({ ticket: serializeTicket(existing) });
  }

  if (event.ticketsSold >= event.ticketsTotal) {
    return NextResponse.json({ error: "Sold out" }, { status: 400 });
  }

  try {
    if (check.ok) {
      const created = await prisma.$transaction(async (tx) => {
        const incremented = await tx.event.updateMany({
          where: { id: eventId, ticketsSold: { lt: event.ticketsTotal } },
          data: { ticketsSold: { increment: 1 } },
        });
        if (incremented.count === 0) throw new Error("SOLD_OUT");
        // Auto-transition to SoldOut when all tickets are gone
        const refreshed = await tx.event.findUnique({ where: { id: eventId }, select: { ticketsSold: true, ticketsTotal: true } });
        if (refreshed && refreshed.ticketsSold >= refreshed.ticketsTotal) {
          await tx.event.updateMany({
            where: { id: eventId, status: "Active" },
            data: { status: "SoldOut" },
          });
        }
        return tx.ticket.create({
          data: {
            eventId,
            ownerId: session.userId,
            txId,
            txStatus: "confirmed",
            amountStx: event.price,
            paidTo: escrow ?? "",
            network,
            status: "Valid",
          },
        });
      });
      return NextResponse.json({ ticket: serializeTicket(created) }, { status: 201 });
    }

    const pending = await prisma.ticket.create({
      data: {
        eventId,
        ownerId: session.userId,
        txId,
        txStatus: "pending",
        amountStx: event.price,
        paidTo: escrow ?? "",
        network,
        status: "Pending",
      },
    });
    return NextResponse.json({ ticket: serializeTicket(pending), pending: true }, { status: 202 });
  } catch (e) {
    if (e instanceof Error && e.message === "SOLD_OUT") {
      return NextResponse.json({ error: "Sold out" }, { status: 400 });
    }
    throw e;
  }
}
