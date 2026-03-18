"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-white to-brand-warm-light/30 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {children}
      </div>
      <footer className="py-6 text-center text-xs text-brand-dark-muted/60 space-x-4">
        <Link href="/regulamin" className="hover:text-brand-dark-muted transition-colors">
          Regulamin
        </Link>
        <Link href="/polityka-prywatnosci" className="hover:text-brand-dark-muted transition-colors">
          Polityka Prywatności
        </Link>
        <Link href="/kontakt" className="hover:text-brand-dark-muted transition-colors">
          Kontakt
        </Link>
        <span className="block mt-2">&copy; {new Date().getFullYear()} Staffer.pl. Wszelkie prawa zastrzeżone.</span>
      </footer>
    </div>
  );
}
