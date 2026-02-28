import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";

const PLANS = [
  {
    name: "Darmowy",
    price: "0",
    period: "zawsze",
    description: "Idealny na start i małe zespoły",
    features: [
      "Do 5 pracowników",
      "Grafik tygodniowy",
      "Giełda zmian",
      "Dostępności",
      "Ogłoszenia zespołowe",
      "Podstawowe podsumowanie",
    ],
    cta: "Zacznij za darmo",
    ctaHref: false,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29",
    period: "mies.",
    description: "Dla rozwijających się firm",
    features: [
      "Nielimitowana liczba pracowników",
      "Wszystko z planu Darmowy",
      "Raporty i analizy",
      "Eksport danych",
      "Szablony grafiku",
      "Priorytetowe wsparcie",
    ],
    cta: "Wybierz Pro",
    ctaHref: true,
    highlighted: true,
  },
];

export default function CennikPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark">
            Prosty cennik
          </h1>
          <p className="mt-4 text-brand-dark-muted">
            Zacznij za darmo. Rozbuduj plan, gdy Twój zespół urośnie. Bez karty
            kredytowej.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                plan.highlighted
                  ? "border-brand bg-brand-muted/20 shadow-xl shadow-brand/20 hover:shadow-2xl hover:shadow-brand/25 ring-2 ring-brand/15"
                  : "border-brand-warm bg-white hover:border-brand/20"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold bg-brand text-white rounded-full">
                  Popularny
                </span>
              )}
              <h2 className="text-xl font-bold text-brand-dark">{plan.name}</h2>
              <p className="mt-1 text-sm text-brand-dark-muted">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-brand-dark">
                  {plan.price} zł
                </span>
                <span className="text-brand-dark-muted">/ {plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-brand-dark-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? "default" : "glass"}
                className={`mt-8 w-full cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  plan.highlighted
                    ? "bg-brand hover:bg-brand-light"
                    : "bg-brand-dark hover:bg-brand-dark-light"
                }`}
              >
                <a href={plan.ctaHref ? `${APP_URL.replace(/\/$/, "")}${APP_URL.endsWith("/app") ? "/billing" : "/app/billing"}` : APP_URL}>{plan.cta}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
