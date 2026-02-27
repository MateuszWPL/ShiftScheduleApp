"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Repeat2,
  Users,
  Megaphone,
  BarChart3,
  Bell,
} from "lucide-react";
import { LandingImage } from "./LandingImage";

const TABS = [
  {
    id: "grafik",
    label: "Grafik",
    icon: Calendar,
    title: "Twórz grafik w kilka minut",
    description:
      "Przeciągnij zmiany na kalendarz, przypisz pracowników, sprawdź konflikty. Widok tygodniowy i miesięczny. Publikacja jednym kliknięciem — zespół dostaje powiadomienie.",
    image: "/landing/TabGrafik.png",
  },
  {
    id: "gielda",
    label: "Giełda zmian",
    icon: Repeat2,
    title: "Oddawanie i przejmowanie zmian",
    description:
      "Pracownik oddaje zmianę, inny ją przejmuje. Bez grupek na WhatsApp. Wszystko w jednym miejscu. Ty tylko zatwierdzasz.",
    image: "/landing/TabGielda.png",
  },
  {
    id: "zespol",
    label: "Zespół",
    icon: Users,
    title: "Zarządzaj składem",
    description:
      "Profile pracowników, stanowiska, umiejętności. Zapraszanie przez kod. Pełna kontrola nad tym, kto ma dostęp do czego.",
    image: "/landing/TabZespol.png",
  },
  {
    id: "dostepnosci",
    label: "Dostępności",
    icon: BarChart3,
    title: "Dostępności w kilka sekund",
    description:
      "Pracownicy zgłaszają kiedy mogą. Menedżer widzi konflikty. Możesz tworzyć zmiany z przeciągania dostępności na kalendarz.",
    image: "/landing/TabDostepnosci.png",
  },
  {
    id: "ogloszenia",
    label: "Ogłoszenia",
    icon: Megaphone,
    title: "Komunikacja z zespołem",
    description:
      "Ogłoszenia z priorytetami. Pilne docierają mailem. Brak chaosu w grupkach — tylko to, co ważne.",
    image: "/landing/TabOgloszenia.png",
  },
  {
    id: "powiadomienia",
    label: "Powiadomienia",
    icon: Bell,
    title: "Zespół na bieżąco",
    description:
      "Powiadomienia o nowym grafiku, przypisaniu do zmiany, aktywnościach na giełdzie. W aplikacji i mailem.",
    image: "/landing/TabPowiadomienia.png",
  },
];

export function AppTabsSection() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const active = TABS.find((t) => t.id === activeId)!;

  return (
    <section className="py-20 sm:py-28 bg-brand-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Co możesz zrobić w aplikacji?
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Przełącz zakładki i zobacz najważniejsze funkcje.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeId === tab.id
                    ? "bg-brand text-white shadow-lg shadow-brand/25"
                    : "bg-white border border-brand-warm text-brand-dark-muted hover:border-brand/40 hover:text-brand-dark"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            className="rounded-2xl border border-brand-warm bg-white overflow-hidden shadow-xl"
            layout
          >
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-8 lg:p-12 order-2 lg:order-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeId}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-xl sm:text-2xl font-bold text-brand-dark">
                      {active.title}
                    </h3>
                    <p className="mt-4 text-brand-dark-muted leading-relaxed">
                      {active.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="relative aspect-video lg:aspect-square order-1 lg:order-2 bg-brand-warm-light/30">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeId}
                    className="absolute inset-0 p-4 lg:p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-full rounded-xl overflow-hidden border border-brand-warm">
                      <LandingImage
                        src={active.image}
                        alt={active.title}
                        placeholderText={active.title}
                        fill
                        sizes="600px"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
