"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { joinTeam } from "@/lib/api";
import { authPaths } from "@/lib/app-paths";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Clock,
  Shield,
  Heart,
  Info,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface Props {
  initialCode: string;
  onBack: () => void;
}

type JoinStep = "enter-code" | "pending";

export function JoinTeamFlow({ initialCode, onBack }: Props) {
  const [step, setStep] = useState<JoinStep>("enter-code");
  const [code, setCode] = useState(initialCode);
  const [pendingTeamName, setPendingTeamName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    if (step === "enter-code") {
      inputRef.current?.focus();
    }
  }, [step]);

  const joinMut = useMutation({
    mutationFn: () => joinTeam(code.trim()),
    onSuccess: (result: any) => {
      if (result?.status === "PENDING") {
        setPendingTeamName(result?.team?.name || "");
        setStep("pending");
        toast.info("Zgłoszenie wysłane");
      } else {
        toast.success("Dołączono do zespołu!");
        window.location.href = "/";
      }
    },
    onError: (err: Error) => {
      toast.error("Błąd dołączania", { description: err.message });
    },
  });

  // Auto-submit when initialCode is pre-filled (arrived via invite link)
  useEffect(() => {
    if (initialCode && !autoSubmitRef.current && !joinMut.isPending) {
      autoSubmitRef.current = true;
      // Small delay so user sees the screen with the pre-filled code before joining
      const timer = setTimeout(() => {
        joinMut.mutate();
      }, 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  if (step === "pending") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-muted flex items-center justify-center">
              <Clock className="w-8 h-8 text-brand" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-brand-dark">Oczekiwanie na akceptację</h2>
            <p className="text-sm text-brand-dark-muted mt-2">
              Twoja prośba o dołączenie do zespołu{" "}
              {pendingTeamName && (
                <span className="font-semibold text-brand-dark">&ldquo;{pendingTeamName}&rdquo;</span>
              )}{" "}
              została wysłana. Powiadomimy Cię, gdy Manager ją zaakceptuje.
            </p>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-brand-muted/30 border border-brand/20 rounded-xl text-left">
            <Info className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-dark-muted">
              Zaproszenie trwa do 24 godzin
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: authPaths.login })}
            className="w-full"
          >
            Wróć do logowania
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-muted flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-brand" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-brand-dark">Dołącz do zespołu</h2>
          <p className="text-sm text-brand-dark-muted mt-1">
            {initialCode
              ? "Znaleziono kod zaproszenia. Dołączanie do zespołu..."
              : "Wpisz kod otrzymany od Managera, aby uzyskać dostęp do panelu."}
          </p>
        </div>

        <div>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={20}
            disabled={joinMut.isPending}
            className="w-full text-center text-xl font-mono font-bold tracking-[0.15em] px-4 py-3 border-2 border-brand-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Wpisz kod zaproszenia"
            onKeyDown={(e) => e.key === "Enter" && code.trim() && joinMut.mutate()}
          />
        </div>

        <Button
          onClick={() => joinMut.mutate()}
          disabled={!code.trim() || joinMut.isPending}
          className="w-full gap-2 h-11"
        >
          {joinMut.isPending ? "Dołączanie..." : "Dołącz do zespołu"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-brand-dark-muted">
          Nie otrzymałeś kodu?{" "}
          <a href="mailto:support@staffer.pl" className="text-brand font-medium hover:text-brand-light">
            Skontaktuj się z administratorem
          </a>
        </p>

        <div className="pt-2 border-t border-brand-warm/30">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-brand-dark-muted">
            <ArrowLeft className="h-4 w-4" />
            Wróć do wyboru
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px] text-brand-dark-muted/50">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            BEZPIECZNE POŁĄCZENIE
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            KONTO DARMOWE 24/7
          </span>
        </div>
      </div>
    </div>
  );
}
