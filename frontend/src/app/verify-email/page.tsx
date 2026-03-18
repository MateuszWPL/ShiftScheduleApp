"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { authPaths } from "@/lib/app-paths";
import { API_URL } from "@/lib/api";
import { CheckCircle2, XCircle, ArrowRight, HelpCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("Brak tokenu weryfikacyjnego.");
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/auth/verify-email/${verificationToken}`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd weryfikacji");

      setStatus("success");
      setMessage(data.message || "Email został pomyślnie zweryfikowany!");
      toast.success("Email zweryfikowany!");
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Błąd weryfikacji emaila.");
      toast.error("Błąd weryfikacji", { description: error.message });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-surface via-white to-brand-warm-light/30">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-brand-warm/30 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" />
          <p className="text-brand-dark-muted">Weryfikowanie emaila...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-surface via-white to-brand-warm-light/30">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-brand-warm/30 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-muted flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-brand" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Email zweryfikowany!</h1>
          <p className="text-sm text-brand-dark-muted">
            Twoje konto jest już aktywne. Możesz teraz przejść do konfiguracji swojego zespołu.
          </p>
          <Link href={authPaths.login}>
            <Button className="w-full gap-2 h-11">
              Przejdź do Onboardingu
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-brand-dark-muted">
            Masz pytania?{" "}
            <a href="mailto:support@staffer.pl" className="text-brand hover:text-brand-light font-medium">
              Skontaktuj się z nami
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-surface via-white to-brand-warm-light/30">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-brand-warm/30 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-red-900">Błąd weryfikacji</h1>
        <p className="text-sm text-brand-dark-muted">{message || "Nieprawidłowy lub wygasły token weryfikacyjny."}</p>
        <Link href={authPaths.login}>
          <Button variant="outline" className="w-full">
            Wróć do logowania
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-surface via-white to-brand-warm-light/30">
          <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" />
            <p className="text-brand-dark-muted">Ładowanie...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
