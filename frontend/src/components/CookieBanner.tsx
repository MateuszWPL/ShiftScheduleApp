"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      // localStorage może być niedostępny (prywatny tryb, itp.)
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      // ignorujemy błędy localStorage
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Informacja o plikach cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50
        bg-white rounded-2xl shadow-xl border border-brand-warm p-4 flex flex-col gap-3
        animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
            <Cookie className="h-4 w-4 text-brand" />
          </div>
          <p className="text-sm font-semibold text-brand-dark">Pliki cookies</p>
        </div>
        <button
          onClick={accept}
          className="p-1 rounded-lg text-brand-dark-soft hover:text-brand-dark hover:bg-brand-warm-light transition-colors cursor-pointer"
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message */}
      <p className="text-xs text-brand-dark-muted leading-relaxed">
        Używamy wyłącznie <strong className="text-brand-dark">niezbędnych ciasteczek</strong> do
        działania aplikacji (sesja, bezpieczeństwo). Brak cookies śledzących ani reklamowych.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/polityka-cookies"
          className="text-xs text-brand hover:text-brand-light transition-colors underline-offset-2 hover:underline"
        >
          Polityka cookies
        </Link>
        <button
          onClick={accept}
          className="px-4 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold
            hover:bg-brand-light transition-colors cursor-pointer active:scale-[0.97]"
        >
          Rozumiem
        </button>
      </div>
    </div>
  );
}
