"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2, Users } from "lucide-react";
import { authPaths } from "@/lib/app-paths";
import { API_URL } from "@/lib/api";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function RegisterContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // After successful auth → redirect to onboarding with invite code if present
  const callbackUrl = inviteCode
    ? `${authPaths.onboarding}?code=${encodeURIComponent(inviteCode)}`
    : authPaths.onboarding;

  const loginHref = inviteCode
    ? `${authPaths.login}?invite=${encodeURIComponent(inviteCode)}`
    : authPaths.login;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Hasła nie są identyczne");
      return;
    }
    if (!acceptTerms) {
      toast.error("Zaakceptuj regulamin, aby kontynuować");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd rejestracji");
      setRegistered(true);
      toast.success("Konto zostało utworzone! Sprawdź skrzynkę email.");
    } catch (error: any) {
      toast.error("Błąd rejestracji", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark">Sprawdź email</h2>
          <p className="text-sm text-brand-dark-muted">
            Wysłaliśmy link weryfikacyjny na adres{" "}
            <strong className="text-brand-dark">{email}</strong>.
            <br />
            Kliknij w link, aby aktywować konto.
          </p>
          {inviteCode && (
            <div className="px-4 py-3 bg-brand-muted/40 border border-brand/20 rounded-xl text-sm text-brand-dark">
              <Users className="inline h-4 w-4 mr-1.5 text-brand" />
              Po weryfikacji emaila zostaniesz automatycznie przekierowany do procesu dołączenia do zespołu.
            </div>
          )}
          <p className="text-xs text-brand-dark-muted/70">
            Nie widzisz maila? Sprawdź folder spam.
          </p>
          <Link href={loginHref}>
            <Button variant="outline" className="w-full">Przejdź do logowania</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-muted flex items-center justify-center">
            <Logo variant="icon" className="h-8 w-8" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-dark">Utwórz konto</h1>
          <p className="text-sm text-brand-dark-muted mt-1">Zacznij zarządzać swoim zespołem</p>
        </div>

        {inviteCode && (
          <div className="mb-4 px-4 py-3 bg-brand-muted/40 border border-brand/20 rounded-xl text-sm text-brand-dark flex items-center gap-2">
            <Users className="h-4 w-4 text-brand flex-shrink-0" />
            <span>Rejestrujesz się z zaproszeniem do zespołu. Po weryfikacji emaila zostaniesz do niego dołączony.</span>
          </div>
        )}

        <Button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          variant="outline"
          className="w-full gap-2 h-11 border-brand-warm hover:bg-brand-warm-light/50 mb-4"
        >
          <GoogleIcon />
          Zarejestruj przez Google
        </Button>

        <div className="relative flex py-3 items-center mb-4">
          <div className="flex-grow border-t border-brand-warm" />
          <span className="flex-shrink mx-4 text-brand-dark-muted text-xs uppercase tracking-wider">lub email</span>
          <div className="flex-grow border-t border-brand-warm" />
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
                className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Jan Kowalski"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="twoj@email.pl"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-10 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Minimum 8 znaków"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-muted/50 hover:text-brand-dark-muted transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">Potwierdź hasło</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Powtórz hasło"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand accent-brand cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-brand-dark-muted">
                Akceptuję{" "}
                <Link href="/terms" className="text-brand hover:underline">Regulamin</Link>
                {" "}i{" "}
                <Link href="/privacy" className="text-brand hover:underline">Politykę prywatności</Link>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptMarketing}
                onChange={(e) => setAcceptMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand accent-brand cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-brand-dark-muted">
                Chcę otrzymywać informacje o nowościach (opcjonalne)
              </span>
            </label>
          </div>

          <Button type="submit" className="w-full gap-2 h-11" disabled={isLoading}>
            {isLoading ? "Tworzenie konta..." : "Utwórz konto"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-sm text-center text-brand-dark-muted mt-6">
          Masz już konto?{" "}
          <Link href={loginHref} className="text-brand hover:text-brand-light font-semibold transition-colors">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-brand-warm border-t-brand rounded-full" />
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
