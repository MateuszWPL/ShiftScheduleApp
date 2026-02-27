"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { APP_URL } from "@/lib/site-config";
import { LandingImage } from "./LandingImage";
import { TrustBadges } from "./TrustBadges";
import { VideoPopup } from "./VideoPopup";

const ROTATING_TEXTS = [
  "bez chaosu",
  "w 5 minut",
  "bez Excela",
  "dla Twojego zespołu",
  "bez grupek na WhatsApp",
];

const stagger = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setRotatingIndex((i) => (i + 1) % ROTATING_TEXTS.length),
      3000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-muted/40 via-transparent to-brand-blue-muted/30" />
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
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-dark min-h-[1.2em] flex flex-wrap items-baseline gap-2"
              >
                Grafik zmian{" "}
                <span className="inline-block min-w-[200px] sm:min-w-[280px] text-left">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={rotatingIndex}
                      className="bg-gradient-to-r from-brand via-brand-light to-brand bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                    >
                      {ROTATING_TEXTS[rotatingIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.h1>
              <motion.p
                variants={item}
                className="mt-6 text-lg sm:text-xl text-brand-dark-muted max-w-xl"
              >
                Twórz grafiki, zarządzaj zespołem i prowadź giełdę zmian w jednej
                prostej aplikacji. Dla restauracji, sklepów i usług.
              </motion.p>

              <motion.div variants={item} className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="text-base cursor-pointer bg-brand hover:bg-brand-light text-white font-semibold shadow-lg shadow-brand/25 hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <a href={APP_URL}>Zacznij za darmo</a>
                </Button>
              </motion.div>

              <motion.div variants={item} className="mt-8">
                <TrustBadges />
              </motion.div>
            </motion.div>

            <motion.div
              className="relative aspect-[16/10] max-w-2xl mx-auto lg:max-w-none"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="group absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-brand-dark/15 ring-2 ring-brand-warm/40 cursor-pointer"
              >
                <LandingImage
                  src="/landing/HeroProduct.png"
                  alt="Kliknij, aby zobaczyć demo"
                  placeholderText="Zrzut ekranu aplikacji"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                    <Play className="h-10 w-10 ml-1 text-brand" fill="currentColor" />
                  </span>
                </div>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium text-white/90 bg-black/40 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Zobacz demo
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <VideoPopup isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  );
}
