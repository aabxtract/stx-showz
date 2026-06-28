import { NextResponse } from "next/server";
import { getTokenBalance } from "@/lib/stacks-tx";

type Ctx = { params: { address: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const balance = await getTokenBalance(params.address);
    return NextResponse.json({ address: params.address, balance });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch balance: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
