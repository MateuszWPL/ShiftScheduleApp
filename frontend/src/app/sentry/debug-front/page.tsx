"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect } from "react";

export default function SentryDebugFrontPage() {
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [sdkStatus, setSdkStatus] = useState<string>("Sprawdzam...");

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const dsnSet = Boolean(dsn && dsn.length > 10);

  useEffect(() => {
    const client = Sentry.getClient();
    if (!client) {
      setSdkStatus("❌ Sentry client NIE istnieje — SDK nie jest zainicjalizowane");
      return;
    }
    const transport = client.getTransport();
    const clientDsn = client.getDsn();
    const parts = [
      `Client: ✅`,
      `DSN w kliencie: ${clientDsn ? clientDsn.host : "BRAK"}`,
      `Transport: ${transport ? "✅" : "❌ BRAK"}`,
    ];
    setSdkStatus(parts.join(" | "));
  }, []);

  function handleCaptureException() {
    try {
      const eventId = Sentry.captureException(
        new Error(
          "[Sentry Frontend Test] captureException — jeśli widzisz to w Sentry, SDK działa!"
        )
      );
      setCaptureStatus(`Wysłano (eventId: ${eventId}). Sprawdź Sentry dashboard i konsolę (debug: true).`);
    } catch (e) {
      setCaptureStatus(`Błąd: ${e}`);
    }
  }

  async function handleCaptureAndFlush() {
    try {
      const eventId = Sentry.captureException(
        new Error(
          "[Sentry Frontend Test] captureException + flush — wymuszam wysyłkę!"
        )
      );
      setCaptureStatus(`eventId: ${eventId} — flushujemy...`);
      const flushed = await Sentry.flush(5000);
      setCaptureStatus(
        flushed
          ? `✅ Flush OK (eventId: ${eventId}). Sprawdź Sentry dashboard.`
          : `⚠️ Flush timeout — Sentry nie zdążył wysłać w 5s (eventId: ${eventId})`
      );
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

  const boxStyle = (ok: boolean) => ({
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    background: ok ? "#dcfce7" : "#fef2f2",
    border: `1px solid ${ok ? "#86efac" : "#fca5a5"}`,
    fontSize: 13,
  });

  return (
    <div style={{ padding: 48, fontFamily: "system-ui, sans-serif", maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Sentry Debug — Frontend</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Weryfikacja integracji Sentry. Otwórz konsolę przeglądarki (F12) — z{" "}
        <code>debug: true</code> zobaczysz logi Sentry SDK.
      </p>

      <div style={boxStyle(dsnSet)}>
        <strong>ENV DSN:</strong>{" "}
        {dsnSet ? `✅ ${dsn!.slice(0, 30)}...` : "❌ BRAK"}
      </div>

      <div style={boxStyle(!sdkStatus.includes("❌"))}>
        <strong>SDK:</strong> {sdkStatus}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={handleCaptureException}
          style={{ padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          1. captureException() — wyślij błąd
        </button>

        <button
          onClick={handleCaptureAndFlush}
          style={{ padding: "12px 24px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          2. captureException() + flush() — wymuś wysyłkę
        </button>

        {captureStatus && (
          <p style={{ color: "#16a34a", fontSize: 13, margin: 0 }}>{captureStatus}</p>
        )}

        <button
          onClick={handleThrowError}
          style={{ padding: "12px 24px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          3. Rzuć niezłapany błąd (crash strony)
        </button>
        <p style={{ color: "#999", fontSize: 12, margin: 0 }}>
          Crash → global-error.tsx → Sentry
        </p>

        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />

        <button
          onClick={handleServerTest}
          style={{ padding: "12px 24px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
        >
          4. Test server-side (API route)
        </button>
        {serverStatus && (
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{serverStatus}</p>
        )}
      </div>
    </div>
  );
}
