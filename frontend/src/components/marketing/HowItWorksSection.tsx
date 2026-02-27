"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Users, UserPlus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_URL } from "@/lib/site-config";
import { LandingImage } from "./LandingImage";

function TimelineLine({ progress }: { progress: MotionValue<number> }) {
  const strokeOffset = useTransform(progress, (v) => 400 * (1 - v));
  return (
    <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden sm:block">
      <svg className="w-full h-full min-h-[400px]" viewBox="0 0 2 400" preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2="400" stroke="currentColor" strokeWidth="2" className="text-brand-warm" />
        <motion.line
          x1="1"
          y1="0"
          x2="1"
          y2="400"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={400}
          className="text-brand"
          style={{ strokeDashoffset: strokeOffset }}
        />
      </svg>
    </div>
  );
}

const STEPS = [
  {
    id: 1,
    icon: Users,
    title: "Załóż zespół",
    description:
      "Utwórz firmę w minutę. Nadaj nazwę zespołowi i gotowe — możesz zapraszać pracowników.",
    image: "/landing/Step1Team.png",
    imageAlt: "Ekran tworzenia zespołu",
  },
  {
    id: 2,
    icon: UserPlus,
    title: "Zaproś pracowników",
    description:
      "Wyślij kod zaproszenia — pracownicy dołączają bez rejestracji firm. Wszystko w jednym miejscu.",
    image: "/landing/Step2Invite.png",
    imageAlt: "Ekran z kodem zaproszenia",
  },
  {
    id: 3,
    icon: CalendarCheck,
    title: "Twórz grafik i publikuj",
    description:
      "Ustaw dostępności, przeciągnij zmiany na kalendarz i opublikuj. Pracownicy dostają powiadomienie.",
    image: "/landing/Step3Schedule.png",
    imageAlt: "Kalendarz z grafikiem",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineProgress = useTransform(scrollYProgress, [0.15, 0.4, 0.65, 0.9], [0, 0.33, 0.66, 1]);

  return (
    <section
      id="jak-dziala"
      ref={sectionRef}
      className="py-20 sm:py-28 bg-white scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Jak to działa
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Trzy proste kroki do uporządkowanego grafiku. Bez skomplikowanych
            integracji i szkoleń.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Linia timeline — rysuje się przy scrollu */}
          <TimelineLine progress={lineProgress} />

          <div className="space-y-16">
            {STEPS.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Button
            asChild
            variant="glass"
            size="lg"
            className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
          >
            <a href={APP_URL}>Zacznij teraz — za darmo</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = step.icon;

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className={`relative flex flex-col sm:flex-row items-center gap-8 ${
        isEven ? "sm:flex-row" : "sm:flex-row-reverse"
      }`}
      initial={{ opacity: 0.6, scale: 0.98 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0.6, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      {/* Kropka na timeline — desktop */}
      <div className="absolute left-1/2 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center z-10">
        <motion.div
          className={`w-4 h-4 rounded-full border-2 ${
            isInView ? "border-brand bg-brand" : "border-brand-warm bg-white"
          }`}
          animate={isInView ? { scale: 1.15 } : {}}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Treść — na przemian lewo/prawo */}
      <div
        className={`flex-1 px-4 sm:px-0 ${
          isEven ? "sm:pr-16 sm:text-right" : "sm:pl-16 sm:text-left"
        }`}
      >
        <div
          className={`inline-flex items-center gap-2 mb-3 ${
            isEven ? "sm:ml-auto" : ""
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center ${
              isInView ? "ring-2 ring-brand/30" : ""
            }`}
          >
            <Icon className="h-5 w-5 text-brand" />
          </div>
          <span className="text-sm font-semibold text-brand">Krok {step.id}</span>
        </div>
        <h3 className="text-xl font-bold text-brand-dark">{step.title}</h3>
        <p className="mt-2 text-brand-dark-muted">{step.description}</p>
      </div>

      {/* Obrazek placeholder */}
      <div
        className={`flex-1 w-full max-w-sm px-4 sm:px-0 ${
          isEven ? "sm:order-first sm:pr-16" : "sm:pl-16"
        }`}
      >
        <motion.div
          className="relative aspect-video rounded-xl overflow-hidden border border-brand-warm shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
          animate={
            isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? -20 : 20 }
          }
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <LandingImage
            src={step.image}
            alt={step.imageAlt}
            placeholderText={step.imageAlt}
            fill
            sizes="400px"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
