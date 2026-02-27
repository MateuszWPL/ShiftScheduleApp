"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  Repeat2,
  Megaphone,
} from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Grafik, który buduje się szybko",
    hook: "Koniec z kopiowaniem z zeszłego tygodnia",
    desc: "Przeciągnij zmiany, przypisz ludzi, sprawdź konflikty. Jedna publikacja i zespół ma grafik na telefonie.",
  },
  {
    icon: Repeat2,
    title: "Giełda zmian bez grupek",
    hook: "Oddaj — weź — zatwierdź",
    desc: "Pracownik oddaje zmianę, ktoś ją przejmuje. Ty tylko akceptujesz. Zero wiadomości w grupie.",
  },
  {
    icon: Clock,
    title: "Dostępności na jednym ekranie",
    hook: "Widzisz kto może, kiedy",
    desc: "Pracownicy zgłaszają dostępność. Ty tworzysz zmiany z przeciągania — bez dopytywania w biegu.",
  },
  {
    icon: Users,
    title: "Zespół pod kontrolą",
    hook: "Profile, stanowiska, kod zaproszenia",
    desc: "Zaproś kodem. Ustaw stanowiska. Wszystko w jednym miejscu — bez skomplikowanego HR.",
  },
  {
    icon: Megaphone,
    title: "Ogłoszenia z priorytetem",
    hook: "Pilne = mail od razu",
    desc: "Ważna informacja? Ustaw priorytet. Pilne trafia mailem. Reszta w aplikacji.",
  },
];

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-brand-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Nie „wszystko czego potrzebujesz” — konkretnie to
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Żadnych zbędnych funkcji. Tylko to, co naprawdę używasz przy grafiku.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="flex gap-6 p-6 rounded-2xl bg-white border border-brand-warm/50 hover:border-brand/30 hover:shadow-lg transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.08 }}
            >
              <div className="w-14 h-14 rounded-xl bg-brand-muted flex items-center justify-center flex-shrink-0">
                <f.icon className="w-7 h-7 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark">{f.title}</h3>
                <p className="text-brand text-sm font-medium mt-1">{f.hook}</p>
                <p className="mt-2 text-brand-dark-muted text-sm">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
