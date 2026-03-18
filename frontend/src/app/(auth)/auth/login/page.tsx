"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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

function LoginContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  // After successful auth, redirect to onboarding with code OR home
  const callbackUrl = inviteCode
    ? `${authPaths.onboarding}?code=${encodeURIComponent(inviteCode)}`
    : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error(result.error);
      if (result?.ok) {
        toast.success("Zalogowano pomyślnie!");
        window.location.href = callbackUrl;
      }
    } catch (error: any) {
      toast.error("Błąd logowania", {
        description: error.message || "Sprawdź email i hasło.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setResetSent(true);
      toast.success("Link do resetu hasła został wysłany!");
    } catch (error: any) {
      toast.error("Błąd", { description: error.message });
    } finally {
      setIsResetLoading(false);
    }
  };

  const registerHref = inviteCode
    ? `${authPaths.register}?invite=${encodeURIComponent(inviteCode)}`
    : authPaths.register;

  if (showReset) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Reset hasła</h1>
            <p className="text-sm text-brand-dark-muted mt-1">
              Podaj swój email, a wyślemy Ci link do resetu hasła
            </p>
          </div>
          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-muted flex items-center justify-center mx-auto">
                <Mail className="h-7 w-7 text-brand" />
              </div>
              <p className="text-sm text-brand-dark-muted">
                Sprawdź skrzynkę <strong>{resetEmail}</strong>
              </p>
              <Button variant="outline" className="w-full" onClick={() => { setShowReset(false); setResetSent(false); }}>
                Wróć do logowania
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  placeholder="twoj@email.pl"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isResetLoading}>
                {isResetLoading ? "Wysyłanie..." : "Wyślij link"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowReset(false)}>
                Wróć do logowania
              </Button>
            </form>
          )}
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
          <h1 className="text-2xl font-bold text-brand-dark">Witaj w Staffer</h1>
          <p className="text-sm text-brand-dark-muted mt-1">Zaloguj się do swojego panelu</p>
        </div>

        {inviteCode && (
          <div className="mb-4 px-4 py-3 bg-brand-muted/40 border border-brand/20 rounded-xl text-sm text-brand-dark text-center">
            Zaloguj się, aby dołączyć do zespołu
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-brand-dark">Hasło</label>
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-xs text-brand hover:text-brand-light transition-colors font-medium"
              >
                Zapomniałeś hasła?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="••••••••"
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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand accent-brand cursor-pointer"
            />
            <span className="text-sm text-brand-dark-muted">Zapamiętaj mnie</span>
          </label>

          <Button type="submit" className="w-full gap-2 h-11" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-brand-warm" />
          <span className="flex-shrink mx-4 text-brand-dark-muted text-xs uppercase tracking-wider">lub kontynuuj przez</span>
          <div className="flex-grow border-t border-brand-warm" />
        </div>

        <Button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          variant="outline"
          className="w-full gap-2 h-11 border-brand-warm hover:bg-brand-warm-light/50"
        >
          <GoogleIcon />
          Zaloguj przez Google
        </Button>

        <p className="text-sm text-center text-brand-dark-muted mt-6">
          Nie masz konta?{" "}
          <Link href={registerHref} className="text-brand hover:text-brand-light font-semibold transition-colors">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
