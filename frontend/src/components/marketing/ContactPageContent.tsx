"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactPageContent() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark">
            Kontakt
          </h1>
          <p className="mt-4 text-brand-dark-muted">
            Napisz do nas — odpowiemy najszybciej jak to możliwe.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-8">
            <div className="flex-1">
              <a
                href="mailto:kontakt@staffer.pl"
                className="flex items-center gap-3 p-4 rounded-xl border border-brand-warm hover:bg-brand-warm-light/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-muted flex items-center justify-center">
                  <Mail className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="font-medium text-brand-dark">Email</p>
                  <p className="text-brand">kontakt@staffer.pl</p>
                </div>
              </a>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-brand-warm">
            <h2 className="text-xl font-semibold text-brand-dark">
              Formularz kontaktowy
            </h2>
            {sent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-6 rounded-xl bg-success-muted border border-success/30"
              >
                <p className="text-success font-medium">
                  Dziękujemy za wiadomość!
                </p>
                <p className="mt-1 text-sm text-brand-dark-muted">
                  Odpowiemy najszybciej jak to możliwe.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-brand-dark mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-brand-warm bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-all"
                    placeholder="twoj@email.pl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-brand-dark mb-1"
                  >
                    Wiadomość
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-brand-warm bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-all resize-none"
                    placeholder="Opowiedz nam o swoim zespole lub pytaniu..."
                  />
                </div>
                <Button
                  type="submit"
                  className="cursor-pointer bg-brand hover:bg-brand-light"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij wiadomość
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
