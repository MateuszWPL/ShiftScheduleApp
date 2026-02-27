"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";
import { TrustBadges } from "./TrustBadges";
import { Check } from "lucide-react";

const PLUSY = [
  "Grafik w kilka minut, nie godzin",
  "Giełda zmian bez grupek na WhatsApp",
  "Dostępności i konflikty na jednym ekranie",
  "Powiadomienia o nowym grafiku i zmianach",
  "Bez Excela, bez papieru, bez chaosu",
];

export function BigCTABanner() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand via-brand-light to-brand-blue/30"
        aria-hidden
      />
      {/* Opcjonalna grafika w tle — dodaj BannerBg.png do public/landing/ */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: "url('/landing/BannerBg.png')" }}
      />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Przejmij kontrolę nad czasem pracy już dzisiaj, ze Stafferem
          </motion.h2>
          <motion.p
            className="mt-6 text-lg text-white/90 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Prosty grafik, giełda zmian i komunikacja w jednym miejscu. Dołącz do
            zespołów, które już nie marnują czasu.
          </motion.p>

          <ul className="mt-10 flex flex-wrap justify-center gap-4">
            {PLUSY.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-center gap-2 text-white/95 text-sm sm:text-base"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>

          <div className="mt-10">
            <TrustBadges variant="dark" className="justify-center" />
          </div>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button
              asChild
              size="lg"
              className="cursor-pointer bg-white text-brand hover:bg-white/90 font-semibold shadow-xl transition-all hover:scale-[1.02]"
            >
              <a href={APP_URL}>Wypróbuj za darmo</a>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
