import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Clock,
  BarChart3,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { APP_URL } from "@/lib/site-config";

const FEATURES = [
  {
    icon: Calendar,
    title: "Grafik tygodniowy",
    description:
      "Intuicyjny kalendarz z widokiem dla menedżera i pracownika. Twórz zmiany, przypisuj pracowników, publikuj jednym kliknięciem.",
  },
  {
    icon: Users,
    title: "Zarządzanie zespołem",
    description:
      "Zapraszanie przez kod, profile pracowników, stanowiska i umiejętności. Pełna kontrola nad składem zespołu.",
  },
  {
    icon: Clock,
    title: "Dostępności",
    description:
      "Pracownicy zgłaszają dostępność. Menedżer widzi konflikty i może tworzyć zmiany z przeciągania.",
  },
  {
    icon: BarChart3,
    title: "Giełda zmian",
    description:
      "Oddawanie i przejmowanie zmian w kilka sekund. Brak chaosu w grupach — wszystko w jednym miejscu.",
  },
  {
    icon: Megaphone,
    title: "Ogłoszenia zespołowe",
    description:
      "Komunikuj ważne informacje z priorytetami. Pilne ogłoszenia docierają mailem.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Wreszcie grafik bez Excela i grupek na WhatsAppie. Zaoszczędziliśmy mnóstwo czasu.",
    author: "Zespół restauracji",
  },
  {
    quote:
      "Giełda zmian działa rewelacyjnie — pracownicy sami się dogadują, my tylko publikujemy.",
    author: "Kierownik sklepu",
  },
];

export default function MarketingHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-muted/30 via-transparent to-brand-blue-muted/20" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-dark tracking-tight">
              Grafik zmian bez chaosu
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-brand-dark-muted max-w-2xl mx-auto">
              Twórz grafiki, zarządzaj zespołem i prowadź giełdę zmian w jednej
              prostej aplikacji. Dla restauracji, sklepów i usług.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base cursor-pointer">
                <a href={APP_URL}>Zacznij za darmo</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base cursor-pointer border-brand-warm hover:bg-brand-warm-light"
              >
                <Link href="/cennik">Zobacz cennik</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark text-center">
            Wszystko, czego potrzebujesz
          </h2>
          <p className="mt-3 text-brand-dark-muted text-center max-w-2xl mx-auto">
            Proste narzędzia do codziennego zarządzania grafikiem i zespołem.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-brand-warm bg-brand-surface hover:border-brand/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-brand-muted flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="font-semibold text-brand-dark text-lg">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-brand-dark-muted">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-brand-warm-light/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark text-center">
            Co mówią użytkownicy
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.author}
                className="p-6 bg-white rounded-xl border border-brand-warm shadow-sm"
              >
                <p className="text-brand-dark-muted italic">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-3 text-sm font-medium text-brand-dark">
                  — {t.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Gotowy na uporządkowany grafik?
            </h2>
            <p className="mt-3 text-white/90">
              Dołącz do zespołów, które już oszczędzają czas dzięki Stafferowi.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-white text-brand hover:bg-white/90 cursor-pointer"
            >
              <a href={APP_URL}>Zacznij za darmo</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
