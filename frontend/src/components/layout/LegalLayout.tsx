import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const otherDocs = [
  { href: "/regulamin", label: "Regulamin" },
  { href: "/polityka-prywatnosci", label: "Polityka Prywatności" },
  { href: "/polityka-cookies", label: "Polityka Cookies" },
];

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-brand-warm shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <Logo variant="icon" className="w-7 h-7" />
            <span className="font-bold text-brand-dark text-sm hidden sm:block">Staffer.pl</span>
          </Link>
          <Link
            href="/app"
            className="text-xs font-medium text-brand-dark-muted hover:text-brand-dark transition-colors"
          >
            ← Wróć do aplikacji
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-brand-dark-muted mt-1">Ostatnia aktualizacja: {lastUpdated}</p>
          )}
        </div>

        {/* Legal prose content */}
        <div className="prose prose-sm sm:prose max-w-none text-brand-dark-muted
          prose-headings:text-brand-dark prose-headings:font-bold
          prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:leading-relaxed prose-p:mb-4
          prose-li:mb-1
          prose-a:text-brand prose-a:no-underline hover:prose-a:underline
          prose-strong:text-brand-dark
          prose-table:text-sm
          prose-th:bg-brand-surface prose-th:font-semibold prose-th:text-brand-dark prose-th:py-2 prose-th:px-3
          prose-td:py-2 prose-td:px-3 prose-td:border-brand-warm
          prose-hr:border-brand-warm">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-warm bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-dark-soft">
            © 2026 Mateusz Woronowicz · Staffer.pl ·{" "}
            <a href="mailto:biuro@staffer.pl" className="hover:text-brand-dark transition-colors">
              biuro@staffer.pl
            </a>
          </p>
          <nav className="flex items-center gap-4">
            {otherDocs.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="text-xs text-brand-dark-muted hover:text-brand-dark transition-colors"
              >
                {doc.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
