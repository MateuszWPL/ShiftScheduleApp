"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Calendar, Shield } from "lucide-react";

const BADGES = [
  { icon: CheckCircle2, text: "WYPRÓBUJ ZA DARMO" },
  { icon: Calendar, text: "14 DNI ZA DARMO" },
  { icon: CreditCard, text: "BEZ KARTY PŁATNICZEJ" },
  { icon: Shield, text: "BEZ ZOBOWIĄZAŃ" },
];

export function TrustBadges({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const badgeClass =
    variant === "dark"
      ? "bg-white/10 border-white/20 text-white"
      : "bg-white/80 border-brand-warm/60 text-brand-dark";

  return (
    <div className={`flex flex-wrap gap-3 sm:gap-4 ${className}`}>
      {BADGES.map((badge, i) => (
        <motion.span
          key={badge.text}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border text-xs font-semibold uppercase tracking-wider shadow-sm ${badgeClass}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.08 }}
        >
          <badge.icon className="h-3.5 w-3.5 text-brand flex-shrink-0" />
          {badge.text}
        </motion.span>
      ))}
    </div>
  );
}
