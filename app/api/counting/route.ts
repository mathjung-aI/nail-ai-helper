import { calculateCounting } from "@/lib/counting";
import type { CountingRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CountingRequest;
    const result = calculateCounting(body);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { ok: false, error: "계산 요청을 처리하지 못했어요." },
      { status: 400 }
    );
  }
}
