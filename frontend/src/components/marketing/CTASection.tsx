"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { APP_URL } from "@/lib/site-config";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl mx-auto text-center p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-brand to-brand-light text-white relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {/* Delikatna textura / glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />

          <div className="relative">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <CheckCircle2 className="h-12 w-12" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Gotowy na uporządkowany grafik?
            </h2>
            <p className="mt-3 text-white/90">
              Dołącz do zespołów, które już oszczędzają czas dzięki Stafferowi.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                variant="glassOnDark"
                size="lg"
                className="bg-white/30 text-white border-white/50 hover:bg-white/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              >
                <a href={APP_URL}>Zacznij za darmo</a>
              </Button>
              <Button
                asChild
                variant="glassOnDark"
                size="lg"
                className="cursor-pointer transition-all duration-200"
              >
                <Link href="/cennik">Zobacz cennik</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/80">
              Prosty cennik: 0 zł na start · 29 zł/mies. gdy urośniesz
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
