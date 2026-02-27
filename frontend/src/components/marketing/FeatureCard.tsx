"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  /** Bento: "default" | "wide" (col-span-2) | "full" (col-span-3) */
  size?: "default" | "wide" | "full";
}

/** Ikona z animacją pojawienia się przy scrollu */
function AnimatedIcon({ Icon, isInView }: { Icon: LucideIcon; isInView: boolean }) {
  return (
    <motion.div
      className="w-12 h-12 rounded-lg bg-brand-muted flex items-center justify-center text-brand"
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={
        isInView
          ? { opacity: 1, scale: 1, rotate: 0 }
          : { opacity: 0, scale: 0.8, rotate: -5 }
      }
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Icon className="h-6 w-6" strokeWidth={2} />
    </motion.div>
  );
}

const sizeClasses = {
  default: "",
  wide: "sm:col-span-2",
  full: "sm:col-span-3",
};

export function FeatureCard({ icon: Icon, title, description, index, size = "default" }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={`group p-6 rounded-xl border border-brand-warm bg-brand-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg backdrop-blur-sm ${sizeClasses[size]}`}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <AnimatedIcon Icon={Icon} isInView={isInView} />
      <h3 className="mt-4 font-semibold text-brand-dark text-lg">{title}</h3>
      <p className="mt-2 text-sm text-brand-dark-muted leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
