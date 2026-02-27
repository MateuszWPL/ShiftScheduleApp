"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";
import {
  ExternalLink,
  Mail,
  FileText,
  Shield,
  BarChart3,
  Calendar,
  BookOpen,
} from "lucide-react";

const PRODUCT_LINKS = [
  { href: "/cennik", label: "Cennik", icon: BarChart3 },
  { href: "#co-oferujemy", label: "Funkcje", icon: Calendar },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: APP_URL, label: "Aplikacja", icon: ExternalLink },
];

const LEGAL_LINKS = [
  { href: "#", label: "Regulamin", icon: FileText },
  { href: "#", label: "Polityka prywatności", icon: Shield },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-brand-warm bg-[#252240] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <Logo variant="full" showPl inverted className="h-8" />
            </Link>
            <p className="mt-4 text-sm text-white/70 max-w-xs">
              Prosty grafik zmian dla restauracji, sklepów i usług. Bez chaosu,
              bez Excela.
            </p>
            <Button
              asChild
              className="mt-6 bg-brand hover:bg-brand-light text-white cursor-pointer"
            >
              <a href={APP_URL}>Zacznij za darmo</a>
            </Button>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-4">
              Produkt
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <link.icon className="h-4 w-4 opacity-60" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-4">
              Dokumenty
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <link.icon className="h-4 w-4 opacity-60" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white/90 mb-4">
              Kontakt
            </h3>
            <Link
              href="/kontakt"
              className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4 opacity-60" />
              Formularz kontaktowy
            </Link>
            <a
              href="mailto:kontakt@staffer.pl"
              className="block mt-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              kontakt@staffer.pl
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Staffer.pl. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-white/40">
            Zarządzanie grafikami zmian · Dla małych zespołów
          </p>
        </div>
      </div>
    </footer>
  );
}
