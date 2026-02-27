"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Clock,
  CalendarPlus,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  setOnboardingWizardSkipped,
  setOnboardingWizardDone,
} from "@/lib/onboarding-storage";

const STEPS = [
  {
    id: "welcome",
    title: "Witaj w Staffer!",
    desc: "Założyłeś firmę. W kilku krokach skonfigurujesz grafik.",
    icon: Sparkles,
    next: "invite",
  },
  {
    id: "invite",
    title: "Zaproś zespół",
    desc: "Udostępnij kod zaproszenia pracownikom, aby dołączyli do zespołu.",
    icon: Users,
    next: "hours",
    prev: "welcome",
  },
  {
    id: "hours",
    title: "Ustaw godziny",
    desc: "Skonfiguruj domyślne godziny pracy i długość zmian.",
    icon: Clock,
    next: "first-shift",
    prev: "invite",
  },
  {
    id: "first-shift",
    title: "Dodaj pierwszą zmianę",
    desc: "Przejdź do grafiku i utwórz pierwszą zmianę dla swojego zespołu.",
    icon: CalendarPlus,
    prev: "hours",
  },
] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string | null;
  onAddFirstShift?: () => void;
}

export function OnboardingWizard({
  isOpen,
  onClose,
  inviteCode,
  onAddFirstShift,
}: Props) {
  const router = useRouter();
  const [stepId, setStepId] = useState<(typeof STEPS)[number]["id"]>("welcome");
  const [codeCopied, setCodeCopied] = useState(false);

  if (!isOpen) return null;

  const step = STEPS.find((s) => s.id === stepId)!;
  const stepIndex = STEPS.findIndex((s) => s.id === stepId);
  const Icon = step.icon;

  const handleSkip = () => {
    setOnboardingWizardSkipped();
    onClose();
  };

  const handleNext = () => {
    if ("next" in step && step.next) {
      setStepId(step.next);
    } else {
      setOnboardingWizardDone();
      onClose();
      if (onAddFirstShift) {
        onAddFirstShift();
      } else {
        router.push("/grafik");
      }
    }
  };

  const handlePrev = () => {
    if ("prev" in step && step.prev) setStepId(step.prev);
  };

  const handleFinish = () => {
    setOnboardingWizardDone();
    onClose();
    if (onAddFirstShift) {
      onAddFirstShift();
    } else {
      router.push("/grafik");
    }
  };

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const goToSettings = () => {
    setOnboardingWizardDone();
    onClose();
    router.push("/settings");
  };

  const goToGrafik = () => {
    setOnboardingWizardDone();
    onClose();
    router.push("/grafik");
    if (onAddFirstShift) setTimeout(onAddFirstShift, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleSkip()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header with skip */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-warm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-brand-dark-muted uppercase tracking-wider">
              Krok {stepIndex + 1} z {STEPS.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-brand-dark-muted hover:text-brand-dark px-2 py-1 rounded-lg hover:bg-brand-warm-light transition-colors flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Pomiń samouczek
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 px-5 pt-4">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i <= stepIndex ? "bg-brand w-6" : "bg-brand-warm w-1.5"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-brand" />
          </div>
          <h2 className="text-lg font-bold text-brand-dark mb-1">{step.title}</h2>
          <p className="text-sm text-brand-dark-muted mb-5">{step.desc}</p>

          {step.id === "invite" && inviteCode && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-brand-warm-light/30 border border-brand-warm mb-5">
              <code className="flex-1 text-xl font-mono tracking-[0.2em] font-bold text-brand-dark select-all text-center">
                {inviteCode}
              </code>
              <button
                onClick={copyCode}
                className="p-2.5 rounded-lg hover:bg-brand-muted text-brand-dark-muted hover:text-brand transition-colors"
                title="Kopiuj kod"
              >
                {codeCopied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          )}

          {step.id === "hours" && (
            <p className="text-xs text-brand-dark-muted mb-4">
              W Ustawieniach → zakładka „Grafik” ustawisz godziny otwarcia/zamknięcia oraz długość zmian.
            </p>
          )}

          {step.id === "first-shift" && (
            <p className="text-xs text-brand-dark-muted mb-4">
              Kliknij w pustą komórkę kalendarza lub przycisk „Dodaj zmianę”, aby utworzyć pierwszą zmianę.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-brand-surface border-t border-brand-warm">
          <div>
            {"prev" in step && step.prev ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-brand-dark-muted"
              >
                <ChevronLeft className="h-4 w-4" />
                Wstecz
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            {step.id === "hours" ? (
              <Button onClick={goToSettings} className="gap-1.5">
                Otwórz ustawienia
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : step.id === "first-shift" ? (
              <Button onClick={goToGrafik} className="gap-1.5">
                Przejdź do grafiku
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : step.next ? (
              <Button onClick={handleNext} className="gap-1.5">
                Dalej
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="gap-1.5">
                Zakończ
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
