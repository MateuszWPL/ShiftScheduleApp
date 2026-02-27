"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { APP_URL } from "@/lib/site-config";
import { LandingImage } from "./LandingImage";

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-muted/30 via-transparent to-brand-blue-muted/20" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.p
              variants={item}
              className="text-sm font-medium text-brand uppercase tracking-wider mb-4"
            >
              Prosty grafik dla zespołu
            </motion.p>
            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-dark"
            >
              Grafik zmian{" "}
              <span className="bg-gradient-to-r from-brand via-brand-light to-brand bg-clip-text text-transparent">
                bez chaosu
              </span>
            </motion.h1>
            <motion.p
              variants={item}
              className="mt-6 text-lg sm:text-xl text-brand-dark-muted max-w-xl"
            >
              Twórz grafiki, zarządzaj zespołem i prowadź giełdę zmian w jednej
              prostej aplikacji. Dla restauracji, sklepów i usług.
            </motion.p>
            <motion.div
              variants={item}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                variant="glass"
                size="lg"
                className="text-base cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <a href={APP_URL}>Zacznij za darmo</a>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="text-base cursor-pointer bg-transparent border-brand-warm/70 hover:bg-brand-warm-light/50 transition-all duration-200 hover:-translate-y-0.5"
              >
                <a href="#jak-dziala">Zobacz jak działa</a>
              </Button>
            </motion.div>
            <motion.p
              variants={item}
              className="mt-6 text-sm text-brand-dark-soft"
            >
              Dołącz do setek zespołów w Polsce · Bez karty kredytowej
            </motion.p>
          </motion.div>

          <motion.div
            className="relative aspect-[16/10] max-w-2xl mx-auto lg:max-w-none"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="absolute inset-0 rounded-2xl shadow-2xl shadow-brand-dark/10 ring-1 ring-brand-warm/50 overflow-hidden">
              <LandingImage
                src="/landing/HeroProduct.png"
                alt="Zrzut ekranu aplikacji Staffer — grafik zmian"
                placeholderText="Zrzut ekranu aplikacji"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
