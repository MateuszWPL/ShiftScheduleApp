"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { googleCalendarCallback } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { paths } from "@/lib/app-paths";

export default function CalendarCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg(
        error === "access_denied"
          ? "Odmówiono dostępu do Google Calendar."
          : `Błąd: ${error}`,
      );
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("Brak kodu autoryzacji.");
      return;
    }

    googleCalendarCallback(code)
      .then(() => {
        setStatus("success");
        setTimeout(() => {
          router.push(paths.grafik);
        }, 2000);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Nie udało się połączyć z Google Calendar.");
      });
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 text-brand animate-spin mb-4" />
          <h2 className="text-lg font-bold text-brand-dark mb-1">
            Łączenie z Google Calendar...
          </h2>
          <p className="text-sm text-brand-dark-muted">
            Proszę czekać, trwa autoryzacja.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-brand-dark mb-1">
            Połączono z Google Calendar!
          </h2>
          <p className="text-sm text-brand-dark-muted">
            Teraz możesz synchronizować zmiany z grafiku. Przekierowanie...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-brand-dark mb-1">
            Nie udało się połączyć
          </h2>
          <p className="text-sm text-brand-dark-muted mb-4">{errorMsg}</p>
          <button
            onClick={() => router.push(paths.grafik)}
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-light text-white text-sm font-medium transition-colors"
          >
            Wróć do grafiku
          </button>
        </>
      )}
    </div>
  );
}
