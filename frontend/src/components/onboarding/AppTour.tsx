"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getAppTourSkipped,
  setAppTourSkipped,
  getAppTourDone,
  setAppTourDone,
} from "@/lib/onboarding-storage";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Megaphone,
  BarChart3,
  Settings,
  User,
  X,
  ChevronRight,
  Compass,
} from "lucide-react";

const BASE_STEPS = [
  { id: "pulpit", target: "[data-tour='nav-pulpit']", href: "/", title: "Pulpit", content: "Tu zobaczysz podsumowanie: Twoje zmiany, godziny i powiadomienia." },
  { id: "grafik", target: "[data-tour='nav-grafik']", href: "/grafik", title: "Grafik", content: "Układaj zmiany, publikuj grafik i zarządzaj dostępnością zespołu." },
  { id: "dostepnosc", target: "[data-tour='nav-dostepnosc']", href: "/dostepnosc", title: "Dostępność", content: "Zgłoś kiedy możesz pracować. Dotknij i przeciągnij, aby dodać bloki.", show: (role: string) => role === "EMPLOYEE" },
  { id: "podsumowanie", target: "[data-tour='nav-podsumowanie']", href: "/podsumowanie", title: "Podsumowanie", content: "Godziny przepracowane, podsumowanie tygodnia i miesięczny widok." },
  { id: "zespol", target: "[data-tour='nav-team']", href: "/team", title: "Pracownicy", content: "Lista zespołu, zarządzanie pracownikami i przypisywanie stanowisk." },
  { id: "profil", target: "[data-tour='nav-profile']", href: "/profile", title: "Mój Profil", content: "Edytuj swoje dane, zdjęcie i ustawienia." },
  { id: "ustawienia", target: "[data-tour='nav-settings']", href: "/settings", title: "Ustawienia", content: "Zarządzaj firmą, stanowiskami, zaproszeniami i preferencjami grafiku.", show: (role: string) => role === "ADMIN" },
];

function getTourSteps(userRole: string) {
  return BASE_STEPS.filter((s) => {
    if (!("show" in s) || typeof s.show !== "function") return true;
    return (s.show as (r: string) => boolean)(userRole);
  });
}

interface Props {
  onClose?: () => void;
  userRole?: string;
}

export function AppTour({ onClose, userRole = "EMPLOYEE" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const tourSteps = getTourSteps(userRole);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const currentStep = tourSteps[step];

  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      });
    } else {
      setTargetRect(null);
    }
  }, [currentStep?.target]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(updateTargetRect, 100);
    const resize = () => updateTargetRect();
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", resize);
    };
  }, [isOpen, currentStep?.target, updateTargetRect]);

  // Nawigacja do widoku przy zmianie kroku
  useEffect(() => {
    if (!isOpen || !currentStep?.href) return;
    if (pathname !== currentStep.href && !pathname.startsWith(currentStep.href + "/")) {
      router.replace(currentStep.href);
    }
  }, [isOpen, step, currentStep?.href, pathname, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        !getAppTourSkipped() &&
        !getAppTourDone() &&
        pathname !== "/" &&
        pathname.startsWith("/")
      ) {
        setShowPrompt(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleSkip = () => {
    setAppTourSkipped();
    setIsOpen(false);
    setShowPrompt(false);
    onClose?.();
  };

  const handleComplete = () => {
    setAppTourDone();
    setIsOpen(false);
    setShowPrompt(false);
    onClose?.();
  };

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      const nextStep = tourSteps[step + 1];
      if (nextStep?.href) router.replace(nextStep.href);
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  if (!showPrompt && !isOpen) return null;

  if (showPrompt && !isOpen) {
    return (
      <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50">
        <div className="bg-white rounded-xl shadow-xl border border-brand-warm p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
            <Compass className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-dark">Przewodnik po aplikacji</p>
            <p className="text-xs text-brand-dark-muted mt-0.5">
              Chcesz zobaczyć krótki przewodnik po głównych sekcjach?
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="text-xs bg-brand hover:bg-brand-light"
                onClick={() => {
                  setShowPrompt(false);
                  setIsOpen(true);
                  setStep(0);
                  router.replace(tourSteps[0]?.href ?? "/");
                }}
              >
                Rozpocznij
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-brand-dark-muted"
                onClick={() => {
                  setAppTourSkipped();
                  setShowPrompt(false);
                }}
              >
                Pomiń
              </Button>
            </div>
          </div>
          <button
            onClick={() => {
              setAppTourSkipped();
              setShowPrompt(false);
            }}
            className="p-1 rounded text-brand-dark-soft hover:text-brand-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {targetRect && (
        <div
          className="absolute border-2 border-brand rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      <div className="absolute inset-0 pointer-events-auto" onClick={handleSkip} />
      <div
        className="fixed left-4 right-4 md:left-auto md:right-6 md:max-w-sm bottom-6 md:bottom-8 z-[91] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-xl shadow-xl border border-brand-warm p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">
                Krok {step + 1} / {tourSteps.length}
              </p>
              <h3 className="text-sm font-bold text-brand-dark mt-0.5">
                {currentStep?.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-brand-dark-muted hover:text-brand-dark px-2 py-1 rounded"
            >
              Pomiń
            </button>
          </div>
          <p className="text-xs text-brand-dark-muted mb-4">
            {currentStep?.content}
          </p>
          <div className="flex justify-between items-center">
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full w-1.5 transition-all ${
                    i <= step ? "bg-brand" : "bg-brand-warm"
                  }`}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleNext} className="gap-1 text-xs">
              {step < tourSteps.length - 1 ? "Dalej" : "Zakończ"}
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
