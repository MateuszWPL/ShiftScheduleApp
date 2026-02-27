"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const FEATURES = [
  {
    icon: Calendar,
    title: "Grafik tygodniowy",
    description:
      "Intuicyjny kalendarz z widokiem dla menedżera i pracownika. Twórz zmiany, przypisuj pracowników, publikuj jednym kliknięciem.",
    size: "wide" as const,
  },
  {
    icon: Users,
    title: "Zarządzanie zespołem",
    description:
      "Zapraszanie przez kod, profile pracowników, stanowiska i umiejętności. Pełna kontrola nad składem zespołu.",
    size: "default" as const,
  },
  {
    icon: Clock,
    title: "Dostępności",
    description:
      "Pracownicy zgłaszają dostępność. Menedżer widzi konflikty i może tworzyć zmiany z przeciągania.",
    size: "default" as const,
  },
  {
    icon: BarChart3,
    title: "Giełda zmian",
    description:
      "Oddawanie i przejmowanie zmian w kilka sekund. Brak chaosu w grupach — wszystko w jednym miejscu.",
    size: "wide" as const,
  },
  {
    icon: Megaphone,
    title: "Ogłoszenia zespołowe",
    description:
      "Komunikuj ważne informacje z priorytetami. Pilne ogłoszenia docierają mailem.",
    size: "full" as const,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28 bg-brand-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Wszystko, czego potrzebujesz
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Proste narzędzia do codziennego zarządzania grafikiem i zespołem.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
              size={feature.size}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
