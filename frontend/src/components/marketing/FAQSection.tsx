"use client";

import { motion } from "framer-motion";

const FAQ_ITEMS = [
  {
    question: "Co to jest Staffer?",
    answer:
      "Staffer to prosty system do tworzenia grafiku zmian, zarządzania zespołem i prowadzenia giełdy zmian. Dedykowany małym zespołom — restauracjom, sklepom, usługom.",
  },
  {
    question: "Czy potrzebuję karty kredytowej, żeby zacząć?",
    answer:
      "Nie. Możesz założyć konto i korzystać z planu Darmowego bez podawania danych karty. Plan Pro jest płatny dopiero gdy z niego skorzystasz.",
  },
  {
    question: "Jak zaprosić pracowników?",
    answer:
      "W ustawieniach zespołu generujesz unikalny kod zaproszenia. Pracownicy wpisują go w aplikacji i dołączają do zespołu. Bez skomplikowanych rejestracji.",
  },
  {
    question: "Czy mogę anulować plan Pro?",
    answer:
      "Tak. W każdej chwili możesz wrócić do planu Darmowego. Nie blokujemy Cię w długoterminowych umowach.",
  },
  {
    question: "Czy dane są bezpieczne?",
    answer:
      "Tak. Używamy szyfrowania i dbamy o zgodność z RODO. Dane przechowujemy na serwerach w UE.",
  },
  {
    question: "Działa na telefonie?",
    answer:
      "Tak. Staffer działa w przeglądarce na dowolnym urządzeniu — telefon, tablet, komputer. Pracownicy mogą sprawdzać grafik i giełdę z komórki.",
  },
];

export function FAQSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Często zadawane pytania
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Odpowiedzi na najpopularniejsze pytania.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-12 max-w-4xl mx-auto">
          {FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
            >
              <h3 className="font-semibold text-brand-dark text-lg">
                {item.question}
              </h3>
              <div className="mt-2 h-px bg-brand-warm/60 w-16" />
              <p className="mt-3 text-brand-dark-muted text-sm leading-relaxed">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
