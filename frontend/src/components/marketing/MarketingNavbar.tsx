"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";
import { Menu, X } from "lucide-react";

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/cennik", label: "Cennik" },
    { href: "/blog", label: "Blog" },
    { href: "#co-oferujemy", label: "Funkcje" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <nav
      className={`w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-brand-warm/40 shadow-lg shadow-black/5"
          : "bg-white/95 backdrop-blur-md border-b border-brand-warm/50"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center min-w-0 shrink transition-opacity hover:opacity-90"
        >
          <Logo showPl />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium rounded-lg text-brand-dark-muted hover:text-brand-dark hover:bg-brand-warm-light/50 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={APP_URL}
            className="px-4 py-2 text-sm font-medium rounded-lg text-brand-dark-muted hover:text-brand-dark"
          >
            Zaloguj się
          </Link>
        </div>

        <div className="hidden md:block">
          <Button asChild size="lg" className="cursor-pointer bg-brand hover:bg-brand-light text-white font-semibold shadow-lg shadow-brand/25 transition-all hover:scale-[1.02]">
            <a href={APP_URL}>Zacznij za darmo</a>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-brand-warm-light/50"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-brand-warm/50 bg-white py-4 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-brand-dark font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href={APP_URL} className="block py-2 text-brand-dark-muted" onClick={() => setMobileOpen(false)}>
            Zaloguj się
          </Link>
          <Button asChild className="w-full mt-4 cursor-pointer bg-brand text-white">
            <a href={APP_URL} onClick={() => setMobileOpen(false)}>Zacznij za darmo</a>
          </Button>
        </div>
      )}
    </nav>
  );
}
