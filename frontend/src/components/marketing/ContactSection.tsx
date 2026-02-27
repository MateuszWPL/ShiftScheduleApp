"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

export function ContactSection() {
  return (
    <section className="py-20 sm:py-28 bg-brand-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Masz pytania?
          </h2>
          <p className="mt-4 text-brand-dark-muted">
            Napisz do nas — chętnie pomożemy wybrać plan i wdrożyć Staffera w
            Twoim zespole.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:kontakt@staffer.pl"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-brand text-white font-semibold hover:bg-brand-light transition-colors"
            >
              <Mail className="h-5 w-5" />
              kontakt@staffer.pl
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-brand-warm text-brand-dark font-medium hover:bg-brand-warm-light transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              Formularz kontaktowy
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
