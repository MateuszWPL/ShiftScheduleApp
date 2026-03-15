import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Endpoint testowy Sentry — sprawdza czy SDK jest poprawnie skonfigurowane.
 *
 * W trybie developerskim: zawsze dostępny.
 * W produkcji: chroniony nagłówkiem `x-debug-secret` zgodnym z env DEBUG_SECRET.
 *
 * Użycie:
 *   Dev:  GET /api/debug/sentry-test
 *   Prod: GET /api/debug/sentry-test   (+ nagłówek: x-debug-secret: <DEBUG_SECRET>)
 *
 * Odpowiedzi:
 *   200 { ok: true, mode: "capture" }  — zdarzenie wysłane do Sentry przez captureException
 *   200 { ok: true, mode: "throw" }    — rzucony błąd złapany przez Sentry error handler
 *   401 — brak lub błędny sekret (w produkcji)
 */
export async function GET(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    const secret = request.headers.get("x-debug-secret");
    const expected = process.env.DEBUG_SECRET;

    if (!expected || secret !== expected) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const mode = request.nextUrl.searchParams.get("mode") ?? "capture";

  if (mode === "throw") {
    // Rzuca błąd — Sentry złapie go przez error boundary / handler
    throw new Error(
      "[Sentry frontend test] Celowo rzucony błąd — tryb 'throw'"
    );
  }

  // Domyślny tryb: ręczny captureException z kontekstem
  const eventId = Sentry.captureException(
    new Error("[Sentry frontend test] Ręczne zdarzenie testowe — tryb 'capture'"),
    {
      tags: {
        test: "true",
        environment: process.env.NODE_ENV ?? "unknown",
      },
    }
  );

  return NextResponse.json({
    ok: true,
    mode: "capture",
    sentryEventId: eventId,
    environment: process.env.NODE_ENV,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? process.env.NEXT_PUBLIC_SENTRY_DSN.replace(/\/\/(.+?)@/, "//***@")
      : "NOT SET — sprawdź NEXT_PUBLIC_SENTRY_DSN",
  });
}
