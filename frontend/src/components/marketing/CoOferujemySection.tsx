"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
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

const SCROLL_BLOCKS = [
  { title: "Oszczędność czasu", profit: "5h/tydz.", desc: "Koniec z ręcznym budowaniem grafiku w Excelu. Drag & drop, dostępności na jednym ekranie." },
  { title: "Mniej stresu", profit: "0 konfliktów", desc: "System pokazuje konflikty przed publikacją. Pracownicy widzą grafik od razu." },
  { title: "Prosty start", profit: "0 zł", desc: "Plan Darmowy dla 5 osób. Bez karty, bez zobowiązań. Upgrade gdy urośniesz." },
];

export function CoOferujemySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeBlock, setActiveBlock] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = blockRefs.current.findIndex((r) => r === entry.target);
          if (i >= 0) setActiveBlock(Math.min(Math.floor(i / 3), SCROLL_BLOCKS.length - 1));
        });
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: 0 }
    );

    blockRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="co-oferujemy" className="py-20 sm:py-28 bg-white scroll-mt-20" ref={sectionRef}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">Wszystkie plany zawierają</h2>
          <p className="mt-3 text-brand-dark-muted">Bez ukrytych opłat. Wszystko w jednej cenie.</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          <div className="lg:col-span-2 lg:sticky lg:top-32 self-start">
            {SCROLL_BLOCKS.map((block, i) => (
              <motion.div
                key={block.title}
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: activeBlock === i ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm font-medium text-brand uppercase tracking-wider">
                  {block.title}
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-brand mt-1">{block.profit}</p>
                <p className="mt-2 text-brand-dark-muted">{block.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                ref={(el) => { blockRefs.current[i] = el; }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-brand-warm-light/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-6 w-6 text-brand" />
                </div>
                <span className="font-medium text-brand-dark">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          className="mt-16 max-w-md mx-auto text-center p-8 rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-white/90 text-sm font-medium uppercase tracking-wider">Plany już od</p>
          <p className="text-4xl font-bold mt-1">0 zł</p>
          <p className="text-white/80 text-sm mt-1">na start · 29 zł/mies. Pro</p>
          <Button asChild size="lg" className="mt-6 bg-white text-brand hover:bg-white/90 font-semibold cursor-pointer shadow-lg">
            <Link href="/cennik">Sprawdź cennik</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
