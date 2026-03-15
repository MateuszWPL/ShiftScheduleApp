import { NextResponse } from "next/server";

export async function GET() {
  throw new Error(
    "[Sentry Server Test] Celowo wywołany błąd server-side — jeśli widzisz to w Sentry, sentry.server.config.ts działa!"
  );

  return NextResponse.json({ ok: true });
}
