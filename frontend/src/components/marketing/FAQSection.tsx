"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Często zadawane pytania
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Odpowiedzi na najpopularniejsze pytania.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={item.question}
              className="rounded-xl border border-brand-warm overflow-hidden transition-colors hover:border-brand/20"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-brand-warm-light/30 transition-colors"
              >
                <span className="font-medium text-brand-dark">
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-brand-dark-muted"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-brand-dark-muted text-sm leading-relaxed border-t border-brand-warm/50">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
