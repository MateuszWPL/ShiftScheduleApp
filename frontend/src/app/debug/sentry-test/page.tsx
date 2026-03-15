"use client";

import * as Sentry from "@sentry/nextjs";

// Ta strona jest dostępna TYLKO w środowisku developerskim
// W produkcji Next.js zbuduje ją statycznie, więc dodajemy ręczną blokadę
export default function SentryTestPage() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const throwClientError = () => {
    throw new Error(
      "[Sentry test] Celowo wywołany błąd klienta — jeśli widzisz to w Sentry, integracja działa!"
    );
  };

  const captureManualEvent = () => {
    const eventId = Sentry.captureMessage("[Sentry test] Ręczne zdarzenie testowe", "info");
    alert(`Wysłano zdarzenie testowe do Sentry. Event ID: ${eventId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Sentry — Test integracji</h1>
        <p className="text-sm text-gray-500">
          Użyj poniższych przycisków, aby sprawdzić czy Sentry poprawnie odbiera
          błędy. Strona dostępna tylko w środowisku{" "}
          <code className="text-orange-500">development</code>.
        </p>
        <div className="space-y-3">
          <button
            onClick={throwClientError}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Rzuć błąd klienta (React error boundary)
          </button>
          <button
            onClick={captureManualEvent}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Wyślij ręczne zdarzenie (captureMessage)
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Backend: <code>GET /debug/sentry-test</code> (tylko dev)
        </p>
      </div>
    </div>
  );
}
