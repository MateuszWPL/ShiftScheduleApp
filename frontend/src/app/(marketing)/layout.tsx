import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Staffer.pl — Zarządzanie grafikami zmian",
  description:
    "Prosty system do tworzenia grafiku zmian, zarządzania zespołem i giełdy zmian. Dla restauracji, sklepów i usług.",
  openGraph: {
    title: "Staffer.pl — Zarządzanie grafikami zmian",
    description:
      "Prosty system do tworzenia grafiku zmian, zarządzania zespołem i giełdy zmian.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-50 w-full border-b border-white/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm shadow-black/5">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center min-w-0 shrink">
            <Logo showPl />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/cennik"
              className="text-sm font-medium text-brand-dark-muted hover:text-brand-dark transition-colors duration-200 hidden sm:inline"
            >
              Cennik
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-brand-dark-muted hover:text-brand-dark transition-colors duration-200 hidden sm:inline"
            >
              Blog
            </Link>
            <Link
              href={APP_URL}
              className="text-sm font-medium text-brand-dark-muted hover:text-brand-dark transition-colors duration-200 hidden sm:inline"
            >
              Zaloguj się
            </Link>
            <Button asChild variant="glass">
              <a
                href={APP_URL}
                className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              >
                Zacznij za darmo
              </a>
            </Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-brand-warm bg-white mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center">
              <Logo variant="icon" className="w-8 h-8" />
              <span className="ml-2 font-semibold text-brand-dark">Staffer.pl</span>
            </Link>
            <div className="flex gap-6 text-sm text-brand-dark-muted">
              <Link href="/cennik" className="hover:text-brand-dark transition-colors">
                Cennik
              </Link>
              <Link href="/blog" className="hover:text-brand-dark transition-colors">
                Blog
              </Link>
              <a
                href={APP_URL}
                className="hover:text-brand-dark transition-colors"
              >
                Aplikacja
              </a>
            </div>
          </div>
          <p className="mt-4 text-center sm:text-left text-xs text-brand-dark-soft">
            © {new Date().getFullYear()} Staffer.pl. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}
