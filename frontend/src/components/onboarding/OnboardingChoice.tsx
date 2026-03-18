"use client";

import { Building2, Users, Shield, Heart, ArrowRight, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface Props {
  userName: string;
  onCreateTeam: () => void;
  onJoinTeam: () => void;
}

export function OnboardingChoice({ userName, onCreateTeam, onJoinTeam }: Props) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-lg border border-brand-warm/30 flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand/20 via-brand to-brand/20" />
            <div className="text-center space-y-6 p-8">
              <div className="flex justify-center gap-3">
                {["#10B77F", "#0F172A", "#D1FAE5", "#10B77F"].map((color, i) => (
                  <div
                    key={i}
                    className="w-12 h-16 rounded-xl shadow-sm"
                    style={{ backgroundColor: color, opacity: 0.3 + i * 0.2 }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-brand-warm rounded-full w-3/4 mx-auto" />
                <div className="h-3 bg-brand-warm-light rounded-full w-1/2 mx-auto" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-brand-warm-light/60 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="absolute bottom-6 left-6 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <Users className="h-3.5 w-3.5" />
              ZESPOŁY +12 nowych członków
            </div>
          </div>
        </div>

        {/* Right side - choices */}
        <div className="space-y-6">
          <div>
            <span className="inline-block text-xs font-semibold text-brand uppercase tracking-wider mb-2">
              Krok 1: Konfiguracja
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark">
              Witaj w{" "}
              <span className="text-brand">Staffer!</span>
            </h1>
            <p className="text-brand-dark-muted mt-2 max-w-md">
              Zacznijmy od skonfigurowania Twojego miejsca pracy. Wybierz ścieżkę, która
              najlepiej odpowiada Twoim potrzebom.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onCreateTeam}
              className="w-full group flex items-center gap-4 p-5 bg-white border-2 border-brand-warm/50 rounded-xl hover:border-brand hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-brand-dark">Załóż nową firmę</h3>
                <p className="text-sm text-brand-dark-muted">
                  Utwórz profil organizacji od podstaw
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-brand-dark-muted group-hover:text-brand transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={onJoinTeam}
              className="w-full group flex items-center gap-4 p-5 bg-white border-2 border-brand-warm/50 rounded-xl hover:border-brand hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-dark flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-brand-dark">Dołącz do zespołu</h3>
                <p className="text-sm text-brand-dark-muted">
                  Użyj linku zaproszenia lub kodu
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-brand-dark-muted group-hover:text-brand transition-colors flex-shrink-0" />
            </button>
          </div>

          <p className="text-xs text-brand-dark-muted">
            Masz pytania?{" "}
            <a href="mailto:support@staffer.pl" className="text-brand hover:text-brand-light font-medium">
              Skontaktuj się z naszym wsparciem
            </a>
          </p>

          <div className="flex items-center gap-4 text-xs text-brand-dark-muted/60 pt-2">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              BEZPIECZEŃSTWO
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              ZAUFANIE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
