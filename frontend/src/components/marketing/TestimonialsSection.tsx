"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "Wreszcie grafik bez Excela i grupek na WhatsAppie. Zaoszczędziliśmy mnóstwo czasu.",
    author: "Anna M.",
    role: "Kierowniczka restauracji, Kraków",
  },
  {
    quote:
      "Giełda zmian działa rewelacyjnie — pracownicy sami się dogadują, my tylko publikujemy.",
    author: "Tomasz K.",
    role: "Kierownik sklepu, Warszawa",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-brand-warm-light/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Co mówią użytkownicy
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Zespoły, które już korzystają ze Staffera.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t, index) => (
            <motion.blockquote
              key={t.author}
              className="p-6 bg-white rounded-xl border border-brand-warm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-brand/20"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <p className="text-brand-dark-muted italic">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 flex flex-col">
                <span className="text-sm font-semibold text-brand-dark">
                  {t.author}
                </span>
                <span className="text-xs text-brand-dark-soft">{t.role}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
