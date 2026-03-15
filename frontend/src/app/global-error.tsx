"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pl">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Coś poszło nie tak
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Wystąpił nieoczekiwany błąd. Nasz zespół został automatycznie
            powiadomiony.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  );
}
