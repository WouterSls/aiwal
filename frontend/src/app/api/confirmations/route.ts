import { NextRequest, NextResponse } from "next/server";
import { enqueue, consume, ConfirmationPayload } from "@/lib/confirmations-store";

export async function POST(req: NextRequest) {
  const payload: ConfirmationPayload = await req.json();
  enqueue(payload);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress) {
    return NextResponse.json([], { status: 400 });
  }
  return NextResponse.json(consume(walletAddress));
}
