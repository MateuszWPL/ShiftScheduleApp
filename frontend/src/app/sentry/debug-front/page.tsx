"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryDebugFrontPage() {
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const dsnSet = Boolean(dsn && dsn.length > 10);

  function handleCaptureException() {
    try {
      const eventId = Sentry.captureException(
        new Error(
          "[Sentry Frontend Test] captureException — jeśli widzisz to w Sentry, SDK działa!"
        )
      );
      setCaptureStatus(`Wysłano (eventId: ${eventId}). Sprawdź Sentry dashboard.`);
    } catch (e) {
      setCaptureStatus(`Błąd: ${e}`);
    }
  }

  function handleThrowError() {
    throw new Error(
      "[Sentry Frontend Test] Unhandled throw — jeśli widzisz to w Sentry, global-error.tsx działa!"
    );
  }

  async function handleServerTest() {
    setServerStatus("Wysyłam request...");
    try {
      const res = await fetch("/api/sentry/debug-server");
      const text = await res.text();
      setServerStatus(`Status: ${res.status} — ${text.slice(0, 200)}`);
    } catch (e) {
      setServerStatus(`Fetch error: ${e}`);
    }
  }

  return (
    <div style={{ padding: 48, fontFamily: "system-ui, sans-serif", maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Sentry Debug — Frontend</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Ta strona służy do weryfikacji integracji Sentry.
      </p>

      <div
        style={{
          padding: 12,
          marginBottom: 24,
          borderRadius: 8,
          background: dsnSet ? "#dcfce7" : "#fef2f2",
          border: `1px solid ${dsnSet ? "#86efac" : "#fca5a5"}`,
          fontSize: 13,
        }}
      >
        <strong>NEXT_PUBLIC_SENTRY_DSN:</strong>{" "}
        {dsnSet
          ? `✅ Ustawione (${dsn!.slice(0, 20)}...)`
          : "❌ BRAK — Sentry nie będzie wysyłać błędów!"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={handleCaptureException}
          style={{
            padding: "12px 24px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          1. Wyślij błąd przez Sentry.captureException()
        </button>
        {captureStatus && (
          <p style={{ color: "#16a34a", fontSize: 13, margin: 0 }}>{captureStatus}</p>
        )}

        <button
          onClick={handleThrowError}
          style={{
            padding: "12px 24px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          2. Rzuć niezłapany błąd (crash strony)
        </button>
        <p style={{ color: "#999", fontSize: 12, margin: 0 }}>
          Spowoduje crash — błąd trafi do Sentry przez global-error.tsx.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />

        <button
          onClick={handleServerTest}
          style={{
            padding: "12px 24px",
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          3. Test server-side (API route /api/sentry/debug-server)
        </button>
        {serverStatus && (
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{serverStatus}</p>
        )}
      </div>
    </div>
  );
}
