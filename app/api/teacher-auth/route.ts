import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const expected = process.env.TEACHER_PASSCODE || "1234";
  const ok = String(body.passcode || "") === expected;
  return NextResponse.json({ ok });
}
