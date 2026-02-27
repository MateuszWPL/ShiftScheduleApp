"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";
import { TrustBadges } from "./TrustBadges";
import { LandingImage } from "./LandingImage";

export function BigCTABanner() {
  return (
    <section className="py-20 sm:py-28 bg-brand-dark overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Przejmij kontrolę nad czasem pracy już dzisiaj, ze Stafferem
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Prosty grafik, giełda zmian i komunikacja w jednym miejscu. Dołącz do
              zespołów, które już nie marnują czasu na Excel i grupy na WhatsApp.
            </p>
            <div className="mt-8">
              <TrustBadges variant="dark" className="justify-center lg:justify-start" />
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="cursor-pointer bg-brand hover:bg-brand-light text-white font-semibold shadow-xl shadow-brand/30 hover:shadow-2xl transition-all hover:scale-[1.02]"
              >
                <a href={APP_URL}>Wypróbuj za darmo</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="relative aspect-[4/3] max-w-xl mx-auto lg:max-w-none rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <LandingImage
              src="/landing/BigCTAGraphic.png"
              alt="Staffer — grafik zmian"
              placeholderText="Zrzut ekranu aplikacji"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
