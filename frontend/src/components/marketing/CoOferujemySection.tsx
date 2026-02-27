"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  MapPin,
  Monitor,
  BarChart3,
  FileDown,
  UserCircle,
  Smartphone,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FEATURES = [
  { icon: Users, label: "Dostępności pracowników" },
  { icon: Calendar, label: "Grafik pracy" },
  { icon: MapPin, label: "Nielimitowane lokalizacje" },
  { icon: Monitor, label: "Nielimitowane urządzenia" },
  { icon: BarChart3, label: "Raporty i statystyki" },
  { icon: FileDown, label: "Eksport do CSV i PDF" },
  { icon: UserCircle, label: "Konta pracownicze" },
  { icon: Smartphone, label: "Aplikacja mobilna" },
  { icon: StickyNote, label: "Ogłoszenia i notatki" },
];

export function CoOferujemySection() {
  return (
    <section id="co-oferujemy" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Wszystkie plany zawierają
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Bez ukrytych opłat. Wszystko w jednej cenie.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-16">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              className="flex items-center gap-3 p-4 rounded-xl border border-brand-warm/50 bg-brand-surface/50 hover:bg-brand-warm-light/30 hover:border-brand/30 transition-all"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                <f.icon className="h-5 w-5 text-brand" />
              </div>
              <span className="font-medium text-brand-dark">{f.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="max-w-lg mx-auto p-8 rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-white/90 text-sm font-medium uppercase tracking-wider">
            Plany już od
          </p>
          <p className="text-4xl sm:text-5xl font-bold mt-1">0 zł</p>
          <p className="text-white/80 text-sm mt-1">na start · 29 zł/mies. Pro</p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-white text-brand hover:bg-white/90 font-semibold cursor-pointer shadow-lg"
          >
            <Link href="/cennik">Sprawdź cennik</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
