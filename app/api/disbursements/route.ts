import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const take = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 100);
  const skip = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const [disbursements, total] = await Promise.all([
    prisma.disbursement.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        event: { select: { id: true, title: true } },
      },
    }),
    prisma.disbursement.count({ where: { userId: session.userId } }),
  ]);

  return NextResponse.json({
    disbursements: disbursements.map((d) => ({
      id: d.id,
      amount: d.amount,
      txId: d.txId,
      txStatus: d.txStatus,
      network: d.network,
      type: d.type,
      event: d.event,
      createdAt: d.createdAt.toISOString(),
    })),
    total,
    limit: take,
    offset: skip,
  });
}
