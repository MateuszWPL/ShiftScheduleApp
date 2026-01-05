"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Odświeżaj sesję co 5 minut (300 sekund) zamiast domyślnego bardzo częstego pollingowania
      refetchOnWindowFocus={false} // Nie odświeżaj przy powrocie do okna (zmniejsza liczbę requestów)
    >
      {children}
    </SessionProvider>
  );
}