import { Check, X, Sparkles, Crown, Building2, ArrowRight } from "lucide-react";
import { APP_URL } from "@/lib/site-config";

/* ───────── Feature comparison data ───────── */

type PlanFlag = boolean | string;

interface FeatureRow {
  name: string;
  free: PlanFlag;
  starter: PlanFlag;
  business: PlanFlag;
}

interface FeatureSection {
  title: string;
  rows: FeatureRow[];
}

const FEATURES: FeatureSection[] = [
  {
    title: "Podstawowe",
    rows: [
      { name: "Pracownicy w zespole", free: "do 5", starter: "do 15", business: "Bez limitu" },
      { name: "Grafik tygodniowy", free: true, starter: true, business: true },
      { name: "Widok kalendarza miesięcznego", free: true, starter: true, business: true },
      { name: "Giełda zmian (oddaj / przejmij)", free: true, starter: true, business: true },
      { name: "Dostępności pracowników", free: true, starter: true, business: true },
      { name: "Ogłoszenia zespołowe", free: true, starter: true, business: true },
      { name: "Powiadomienia w aplikacji", free: true, starter: true, business: true },
      { name: "Powiadomienia email", free: true, starter: true, business: true },
    ],
  },
  {
    title: "Grafik i planowanie",
    rows: [
      { name: "Tworzenie i publikacja zmian", free: true, starter: true, business: true },
      { name: "Kopiowanie grafiku tygodniowego", free: true, starter: true, business: true },
      { name: "Walidacja (konflikty, 11h odpoczynku)", free: true, starter: true, business: true },
      { name: "Stanowiska (kolorowanie, filtrowanie)", free: true, starter: true, business: true },
      { name: "Szablony grafiku", free: false, starter: false, business: true },
      { name: "Wiele lokalizacji / oddziałów", free: false, starter: false, business: true },
    ],
  },
  {
    title: "Zespół i zarządzanie",
    rows: [
      { name: "Zaproszenia przez kod", free: true, starter: true, business: true },
      { name: "Akceptacja / odrzucanie członków", free: true, starter: true, business: true },
      { name: "Profile pracowników", free: true, starter: true, business: true },
      { name: "Onboarding (kreator + tour)", free: true, starter: true, business: true },
      { name: "Ustawienia firmy (godziny, preferencje)", free: true, starter: true, business: true },
      { name: "Zaawansowane role i uprawnienia", free: false, starter: false, business: true },
    ],
  },
  {
    title: "Raporty i eksport",
    rows: [
      { name: "Podsumowanie tygodnia / miesiąca", free: "Podstawowe", starter: "Pełne", business: "Pełne" },
      { name: "Raporty godzin pracy", free: false, starter: true, business: true },
      { name: "Raporty kosztów wynagrodzeń", free: false, starter: true, business: true },
      { name: "Raport zgodności z Kodeksem Pracy", free: false, starter: true, business: true },
      { name: "Eksport do PDF", free: false, starter: true, business: true },
      { name: "Eksport do Excel / CSV", free: false, starter: true, business: true },
      { name: "Integracja z Google Calendar / iCal", free: false, starter: true, business: true },
    ],
  },
  {
    title: "Zaawansowane",
    rows: [
      { name: "Powiadomienia push (PWA)", free: false, starter: false, business: true },
      { name: "Przypomnienia o zmianie", free: false, starter: false, business: true },
      { name: "Audit log (historia zmian)", free: false, starter: false, business: true },
      { name: "Priorytetowe wsparcie", free: false, starter: true, business: true },
      { name: "Dashboard wielu lokalizacji", free: false, starter: false, business: true },
    ],
  },
];

/* ───────── Plan cards data ───────── */

const PLANS = [
  {
    id: "free",
    name: "Darmowy",
    subtitle: "Na start i małe zespoły",
    price: "0",
    period: "na zawsze",
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      "Do 5 pracowników",
      "Grafik tygodniowy + miesięczny",
      "Giełda zmian",
      "Dostępności pracowników",
      "Ogłoszenia zespołowe",
      "Powiadomienia email",
      "Stanowiska i kolorowanie",
      "Kopiowanie grafiku",
    ],
    cta: "Zacznij za darmo",
    ctaHref: APP_URL,
    highlighted: false,
    badge: null as string | null,
    gradient: "from-brand-warm/30 to-brand-warm/10",
    borderColor: "border-brand-warm",
    iconBg: "bg-brand-warm",
    iconColor: "text-brand-dark",
  },
  {
    id: "starter",
    name: "Starter",
    subtitle: "Dla rozwijających się firm",
    price: "29",
    period: "mies.",
    icon: <Crown className="h-6 w-6" />,
    features: [
      "Do 15 pracowników",
      "Wszystko z Darmowego",
      "Raporty godzin i kosztów",
      "Eksport PDF / Excel / CSV",
      "Raport zgodności z KP",
      "Google Calendar / iCal",
      "Priorytetowe wsparcie",
      "14 dni próby za darmo",
    ],
    cta: "Wypróbuj 14 dni za darmo",
    ctaHref: `${APP_URL.replace(/\/$/, "")}${APP_URL.endsWith("/app") ? "/billing" : "/app/billing"}`,
    highlighted: false,
    badge: "14 dni za darmo",
    gradient: "from-brand-blue/20 to-brand-blue/5",
    borderColor: "border-brand-blue",
    iconBg: "bg-brand-blue-muted",
    iconColor: "text-brand-blue",
  },
  {
    id: "business",
    name: "Business",
    subtitle: "Pełna kontrola bez ograniczeń",
    price: "79",
    period: "mies.",
    icon: <Building2 className="h-6 w-6" />,
    features: [
      "Bez limitu pracowników",
      "Wszystko ze Startera",
      "Szablony grafiku",
      "Wiele lokalizacji",
      "Zaawansowane role i uprawnienia",
      "Powiadomienia push",
      "Audit log",
      "Dashboard zbiorczy",
    ],
    cta: "Wybierz Business",
    ctaHref: `${APP_URL.replace(/\/$/, "")}${APP_URL.endsWith("/app") ? "/billing" : "/app/billing"}`,
    highlighted: true,
    badge: "Najpopularniejszy",
    gradient: "from-brand/15 to-brand-muted/30",
    borderColor: "border-brand",
    iconBg: "bg-brand-muted",
    iconColor: "text-brand",
  },
];

/* ───────── Cell renderer ───────── */

function CellValue({ value }: { value: PlanFlag }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-brand-dark">{value}</span>;
  }
  if (value) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-muted">
        <Check className="h-4 w-4 text-success" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
      <X className="h-3.5 w-3.5 text-gray-300" />
    </span>
  );
}

/* ───────── Page ───────── */

export default function CennikPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-brand-muted text-brand">
            Cennik
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark leading-tight">
            Wybierz plan idealny
            <br />
            <span className="text-brand">dla Twojego zespołu</span>
          </h1>
          <p className="mt-4 text-brand-dark-muted text-base sm:text-lg max-w-xl mx-auto">
            Zacznij za darmo, bez karty kredytowej. Rozbuduj plan, gdy Twój
            zespół urośnie.
          </p>
        </div>

        {/* ─── Plan cards ─── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16 sm:mb-24">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-b ${plan.gradient} ${plan.borderColor} ${
                plan.highlighted
                  ? "shadow-xl shadow-brand/15 ring-1 ring-brand/10 scale-[1.02] lg:scale-105"
                  : "shadow-md"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                    plan.highlighted
                      ? "bg-brand text-white shadow-lg shadow-brand/30"
                      : "bg-brand-blue text-white shadow-lg shadow-brand-blue/30"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${plan.iconBg} ${plan.iconColor}`}
                >
                  {plan.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-dark">
                    {plan.name}
                  </h2>
                  <p className="text-xs text-brand-dark-muted">
                    {plan.subtitle}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight">
                  {plan.price}
                </span>
                <span className="text-lg text-brand-dark-muted font-medium">
                  zł
                </span>
                <span className="text-sm text-brand-dark-soft ml-0.5">
                  / {plan.period}
                </span>
              </div>

              {/* Features list */}
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-dark-muted leading-tight">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={plan.ctaHref}
                className={`flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  plan.highlighted
                    ? "bg-brand hover:bg-brand-light text-white shadow-lg shadow-brand/25"
                    : plan.id === "starter"
                      ? "bg-brand-dark hover:bg-brand-dark-light text-white shadow-md"
                      : "bg-white hover:bg-brand-warm text-brand-dark border border-brand-warm shadow-sm"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        {/* ─── Feature comparison table ─── */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
              Porównaj wszystkie funkcje
            </h2>
            <p className="text-sm text-brand-dark-muted mt-2">
              Szczegółowe porównanie pakietów — sprawdź, co najlepiej pasuje do
              Twojego zespołu
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-2xl border border-brand-warm overflow-hidden shadow-sm bg-white">
            {/* Header */}
            <div className="grid grid-cols-4 border-b border-brand-warm bg-gradient-to-r from-brand-warm-light to-white">
              <div className="p-4 sm:p-5 font-semibold text-brand-dark text-sm">
                Funkcja
              </div>
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 sm:p-5 text-center font-bold text-sm ${
                    plan.highlighted
                      ? "bg-brand/5 text-brand"
                      : "text-brand-dark"
                  }`}
                >
                  <div>{plan.name}</div>
                  <div className="text-xs font-medium text-brand-dark-soft mt-0.5">
                    {plan.price} zł / {plan.period}
                  </div>
                </div>
              ))}
            </div>

            {/* Sections */}
            {FEATURES.map((section) => (
              <div key={section.title}>
                {/* Section header */}
                <div className="grid grid-cols-4 border-b border-brand-warm/60 bg-brand-warm-light/50">
                  <div className="col-span-4 px-5 py-3 font-bold text-sm text-brand-dark tracking-wide uppercase">
                    {section.title}
                  </div>
                </div>
                {/* Rows */}
                {section.rows.map((row, i) => (
                  <div
                    key={row.name}
                    className={`grid grid-cols-4 border-b border-brand-warm/30 transition-colors duration-150 hover:bg-brand-warm-light/30 ${
                      i % 2 === 0 ? "bg-white" : "bg-brand-surface/50"
                    }`}
                  >
                    <div className="p-4 sm:px-5 text-sm text-brand-dark-muted flex items-center">
                      {row.name}
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      <CellValue value={row.free} />
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      <CellValue value={row.starter} />
                    </div>
                    <div
                      className={`p-4 flex items-center justify-center ${
                        PLANS[2].highlighted ? "bg-brand/[0.02]" : ""
                      }`}
                    >
                      <CellValue value={row.business} />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Bottom CTA row */}
            <div className="grid grid-cols-4 border-t border-brand-warm bg-gradient-to-r from-brand-warm-light/50 to-white">
              <div className="p-5" />
              {PLANS.map((plan) => (
                <div key={plan.id} className="p-4 flex items-center justify-center">
                  <a
                    href={plan.ctaHref}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      plan.highlighted
                        ? "bg-brand hover:bg-brand-light text-white shadow-md shadow-brand/20"
                        : plan.id === "starter"
                          ? "bg-brand-dark hover:bg-brand-dark-light text-white shadow-sm"
                          : "bg-brand-warm hover:bg-brand-warm/80 text-brand-dark"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: collapsible sections */}
          <div className="sm:hidden space-y-6">
            {FEATURES.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-brand-warm overflow-hidden bg-white shadow-sm"
              >
                <div className="px-4 py-3 bg-brand-warm-light/50 border-b border-brand-warm/60">
                  <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                    {section.title}
                  </h3>
                </div>
                {section.rows.map((row, i) => (
                  <div
                    key={row.name}
                    className={`px-4 py-3 border-b border-brand-warm/20 ${
                      i % 2 === 0 ? "bg-white" : "bg-brand-surface/40"
                    }`}
                  >
                    <div className="text-sm font-medium text-brand-dark mb-2">
                      {row.name}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { label: "Free", val: row.free },
                          { label: "Starter", val: row.starter },
                          { label: "Business", val: row.business },
                        ] as const
                      ).map((cell) => (
                        <div
                          key={cell.label}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span className="text-[10px] font-semibold text-brand-dark-soft uppercase tracking-wider">
                            {cell.label}
                          </span>
                          <CellValue value={cell.val} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-sm text-brand-dark-soft max-w-lg mx-auto">
            Wszystkie płatne plany zawierają 14-dniowy okres próbny. Możesz
            anulować lub zmienić plan w dowolnym momencie. Brak ukrytych opłat.
          </p>
        </div>
      </div>
    </div>
  );
}
