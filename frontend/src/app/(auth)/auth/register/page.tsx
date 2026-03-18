"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import { authPaths } from "@/lib/app-paths";
import { API_URL } from "@/lib/api";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Hasła nie są identyczne");
      return;
    }

    if (password.length < 8) {
      toast.error("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      toast.error("Wymagana akceptacja dokumentów", {
        description: "Zaakceptuj Regulamin i Politykę Prywatności, aby kontynuować.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd rejestracji");

      toast.success("Konto utworzone!", {
        description: "Sprawdź email w celu weryfikacji.",
      });
      setIsRegistered(true);
    } catch (error: any) {
      toast.error("Błąd rejestracji", {
        description: error.message || "Spróbuj ponownie później.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-muted flex items-center justify-center mx-auto mb-4">
            <Mail className="h-7 w-7 text-brand" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark mb-2">Sprawdź swoją skrzynkę!</h2>
          <p className="text-sm text-brand-dark-muted mb-6">
            Wysłaliśmy email weryfikacyjny na adres <strong>{email}</strong>.
            Kliknij link w emailu aby zweryfikować konto.
          </p>
          <ResendVerificationButton email={email} />
          <div className="mt-6">
            <Link href={authPaths.login}>
              <Button variant="outline" className="w-full">Przejdź do logowania</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-dark">Załóż konto firmowe</h1>
          <p className="text-sm text-brand-dark-muted mt-1">
            Dołącz do nowoczesnego zarządzania zespołem Staffer.pl
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">Imię i nazwisko</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={50}
                className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Jan Kowalski"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">Firmowy adres e-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="nazwa@firma.pl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">Powtórz hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand flex-shrink-0 cursor-pointer accent-brand"
              />
              <span className="text-xs text-brand-dark-muted leading-relaxed">
                Akceptuję{" "}
                <a href="/regulamin" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-light font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  Regulamin
                </a>{" "}
                oraz{" "}
                <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-light font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  Politykę Prywatności
                </a>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand flex-shrink-0 cursor-pointer accent-brand"
              />
              <span className="text-xs text-brand-dark-muted leading-relaxed">
                Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z{" "}
                <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-light font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  RODO
                </a>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 h-11"
            disabled={isLoading || !termsAccepted || !privacyAccepted}
          >
            {isLoading ? "Tworzenie konta..." : "Utwórz konto"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-brand-warm" />
          <span className="flex-shrink mx-4 text-brand-dark-muted text-xs uppercase tracking-wider">lub kontynuuj z</span>
          <div className="flex-grow border-t border-brand-warm" />
        </div>

        <Button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          variant="outline"
          className="w-full gap-2 h-11 border-brand-warm hover:bg-brand-warm-light/50"
        >
          <GoogleIcon />
          Google
        </Button>

        <p className="text-sm text-center text-brand-dark-muted mt-6">
          Masz już konto?{" "}
          <Link href={authPaths.login} className="text-brand hover:text-brand-light font-semibold transition-colors">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
