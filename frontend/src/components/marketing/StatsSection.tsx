"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { Clock, Zap, Users } from "lucide-react";

const STATS = [
  {
    icon: Clock,
    value: 5,
    suffix: " min",
    label: "Setup od zera do pierwszego grafiku",
  },
  {
    icon: Zap,
    value: 3,
    suffix: "x",
    label: "Szybsze tworzenie grafiku niż w Excelu",
  },
  {
    icon: Users,
    value: 5,
    suffix: "",
    label: "Pracowników za darmo na start",
  },
];

export function StatsSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-muted/50 text-brand mb-4">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-brand-dark">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-sm text-brand-dark-muted">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
