"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { Clock, Zap, Users } from "lucide-react";

const STATS = [
  { icon: Clock, value: 5, suffix: " min", label: "Setup od zera do pierwszego grafiku" },
  { icon: Zap, value: 3, suffix: "x", label: "Szybsze tworzenie grafiku niż w Excelu" },
  { icon: Users, value: 5, suffix: "", label: "Pracowników za darmo na start" },
];

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-muted/60 text-brand mb-4 [&_svg]:stroke-[2.5]"
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : {}}
                transition={{ delay: index * 0.15 + 0.2, type: "spring", stiffness: 200 }}
              >
                <stat.icon className="w-6 h-6" />
              </motion.div>
              <motion.div
                className="text-3xl sm:text-4xl font-bold text-brand-dark"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: index * 0.15 + 0.4 }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </motion.div>
              <p className="mt-2 text-sm text-brand-dark-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
