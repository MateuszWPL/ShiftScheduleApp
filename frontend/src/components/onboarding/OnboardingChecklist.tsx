"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X, Check, ChevronRight, Rocket } from "lucide-react";
import { getTeamMembers, getPositions, getShifts } from "@/lib/api";
import { paths } from "@/lib/app-paths";
import {
  getSetupChecklistDismissed,
  setSetupChecklistDismissed,
} from "@/lib/onboarding-storage";

interface Props {
  userRole?: string;
}

const STEPS = [
  {
    id: "invite",
    label: "Zaproś pierwszych pracowników",
    description: "Dodaj członków swojego zespołu przez e-mail lub kod.",
    href: paths.team,
    cta: "Przejdź do pracowników",
  },
  {
    id: "positions",
    label: "Skonfiguruj stanowiska",
    description: "Dodaj role takie jak Kierownik, Sprzedawca itp.",
    href: paths.settings,
    cta: "Przejdź do stanowisk",
  },
  {
    id: "shift",
    label: "Dodaj pierwszą zmianę",
    description: "Stwórz pierwszą zmianę w swoim grafiku.",
    href: paths.grafik,
    cta: "Przejdź do grafiku",
  },
  {
    id: "publish",
    label: "Opublikuj grafik",
    description: "Poinformuj zespół o nowym harmonogramie.",
    href: paths.grafik,
    cta: "Przejdź do grafiku",
  },
] as const;

export function OnboardingChecklist({ userRole }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAdmin = userRole === "OWNER" || userRole === "MANAGER";

  useEffect(() => {
    setMounted(true);
    if (getSetupChecklistDismissed()) {
      setDismissed(true);
    }
  }, []);

  const enabled = isAdmin && mounted && !dismissed;

  const { data: members } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled,
    staleTime: 30_000,
  });

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    enabled,
    staleTime: 30_000,
  });

  const { data: shifts } = useQuery({
    queryKey: ["shifts-checklist"],
    queryFn: () => getShifts(),
    enabled,
    staleTime: 30_000,
  });

  if (!mounted || !isAdmin || dismissed) return null;

  const hasMembers = (members?.length ?? 0) > 1;
  const hasPositions = (positions?.length ?? 0) > 0;
  const hasShift = (shifts?.length ?? 0) > 0;
  const hasPublished = shifts?.some((s) => s.status === "PUBLISHED") ?? false;

  const completionMap: Record<string, boolean> = {
    invite: hasMembers,
    positions: hasPositions,
    shift: hasShift,
    publish: hasPublished,
  };

  const completedCount = STEPS.filter((s) => completionMap[s.id]).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  if (completedCount === STEPS.length) return null;

  const currentStepIndex = STEPS.findIndex((s) => !completionMap[s.id]);

  const handleDismiss = () => {
    setSetupChecklistDismissed();
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div
        className="
          backdrop-blur-md
          bg-white/85
          border border-white/70
          shadow-xl shadow-black/10
          rounded-2xl
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-brand-warm/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Rocket className="h-4 w-4 text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark leading-tight">
                  Twoje kroki wdrożeniowe
                </h3>
                <p className="text-xs text-brand-dark-muted mt-0.5 leading-snug">
                  Zakończ te kroki, aby skonfigurować swój&nbsp;zespół.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-brand-dark-soft hover:text-brand-dark hover:bg-brand-warm/40 transition-colors duration-150 flex-shrink-0 cursor-pointer"
              aria-label="Zamknij"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="px-4 py-3 space-y-1">
          {STEPS.map((step, index) => {
            const done = completionMap[step.id];
            const isCurrent = index === currentStepIndex;
            const isPending = !done && !isCurrent;

            return (
              <div key={step.id} className="py-2">
                <div className="flex items-start gap-3">
                  {/* Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    {done ? (
                      <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full border-2 border-brand bg-brand/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-brand">
                          {index + 1}
                        </span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-brand-warm bg-transparent flex items-center justify-center">
                        <span className="text-[10px] font-medium text-brand-dark-soft">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-tight ${
                        done
                          ? "text-brand-dark-soft line-through"
                          : isCurrent
                            ? "text-brand-dark"
                            : "text-brand-dark-muted"
                      }`}
                    >
                      {step.label}
                    </p>

                    {done ? (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-brand uppercase tracking-wider">
                        Ukończono
                      </span>
                    ) : isCurrent ? (
                      <>
                        <p className="text-xs text-brand-dark-muted mt-0.5 leading-snug">
                          {step.description}
                        </p>
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-0.5 mt-1.5 text-xs font-semibold text-brand hover:text-brand-light transition-colors duration-150 cursor-pointer"
                        >
                          {step.cta}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs text-brand-dark-soft mt-0.5 leading-snug">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="px-5 py-4 border-t border-brand-warm/50 bg-brand-warm-light/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-brand-dark-muted">
              Postęp konfiguracji
            </span>
            <span className="text-xs font-bold text-brand">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-brand-warm overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
