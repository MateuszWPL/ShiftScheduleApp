"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryDebugFrontPage() {
  const [sent, setSent] = useState(false);

  function handleCaptureException() {
    Sentry.captureException(
      new Error(
        "[Sentry Frontend Test] captureException — jeśli widzisz to w Sentry, SDK działa!"
      )
    );
    setSent(true);
  }

  function handleThrowError() {
    throw new Error(
      "[Sentry Frontend Test] Unhandled throw — jeśli widzisz to w Sentry, global-error.tsx działa!"
    );
  }

  return (
    <div style={{ padding: 48, fontFamily: "system-ui, sans-serif", maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Sentry Debug — Frontend</h1>
      <p style={{ color: "#666", marginBottom: 32, fontSize: 14 }}>
        Ta strona służy do weryfikacji integracji Sentry po stronie klienta.
      </p>

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
        {sent && (
          <p style={{ color: "green", fontSize: 13, margin: 0 }}>
            Wysłano — sprawdź Sentry dashboard.
          </p>
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
          Ten przycisk spowoduje crash — błąd trafi do Sentry przez global-error.tsx.
        </p>
      </div>
    </div>
  );
}
