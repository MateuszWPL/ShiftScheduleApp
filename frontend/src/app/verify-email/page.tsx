"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

import { API_URL } from "@/lib/api";

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

      if (!res.ok) {
        throw new Error(data.message || "Błąd weryfikacji");
      }

      setStatus("success");
      setMessage(data.message || "Email został pomyślnie zweryfikowany!");
      toast.success("Email zweryfikowany!", {
        description: "Możesz się teraz zalogować.",
      });

      // Przekieruj do logowania po 3 sekundach
      setTimeout(() => {
        router.push(paths.home);
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Błąd weryfikacji emaila.");
      toast.error("Błąd weryfikacji", {
        description: error.message,
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-surface">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-brand-dark-muted">Weryfikowanie emaila...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-surface">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-green-50 rounded-full">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-900">Email zweryfikowany!</h1>
          <p className="text-brand-dark-muted">{message}</p>
          <p className="text-sm text-brand-dark-muted">Przekierowywanie do logowania...</p>
          <Link href={paths.home}>
            <Button>Przejdź do logowania</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-brand-surface">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-red-50 rounded-full">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-red-900">Błąd weryfikacji</h1>
        <p className="text-brand-dark-muted">{message || "Nieprawidłowy lub wygasły token weryfikacyjny."}</p>
        <div className="space-y-2">
          <Link href={paths.home}>
            <Button variant="outline" className="w-full">
              Wróć do strony głównej
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-brand-surface">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-brand-dark-muted">Ładowanie...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

