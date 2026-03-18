"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { ResendVerificationButton } from "./ResendVerificationButton";

// Google Logo SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

import { API_URL } from "@/lib/api";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Błąd rejestracji");
      }

      toast.success("Konto utworzone!", {
        description: "Sprawdź email w celu weryfikacji. Następnie możesz się zalogować.",
      });

      // Pokaż informację o weryfikacji
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
      <div className="space-y-4">
        <div className="p-4 bg-brand-blue-muted/50 border border-brand-blue/30 rounded-lg text-center">
          <div className="flex justify-center mb-2">
            <svg className="w-8 h-8 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-brand-dark mb-2">Sprawdź swoją skrzynkę pocztową!</h3>
          <p className="text-sm text-brand-dark-muted mb-4">
            Wysłaliśmy email weryfikacyjny na adres <strong>{email}</strong>.
            Kliknij link w emailu aby zweryfikować konto.
          </p>
          <ResendVerificationButton email={email} />
          <p className="text-xs text-brand-dark-muted mt-4">
            Po weryfikacji możesz się zalogować.
          </p>
        </div>
        <Button variant="outline" className="w-full cursor-pointer" onClick={() => onSwitchToLogin()}>
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-brand-warm rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-150"
          placeholder="twoj@email.pl"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-brand-dark mb-1">
          Imię i Nazwisko
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          className="w-full p-2 border border-brand-warm rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-150"
          placeholder="Jan Kowalski"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-brand-dark mb-1">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full p-2 border border-brand-warm rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-150"
          placeholder="Minimum 8 znaków"
        />
        <p className="text-xs text-brand-dark-muted mt-1">
          Min. 8 znaków, 1 wielka litera, 1 cyfra
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-dark mb-1">
          Potwierdź Hasło
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full p-2 border border-brand-warm rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-150"
          placeholder="Powtórz hasło"
        />
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-2.5 py-1">
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand flex-shrink-0 cursor-pointer accent-brand"
          />
          <span className="text-xs text-brand-dark-muted leading-relaxed">
            Akceptuję{" "}
            <a
              href="/regulamin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-brand-light font-medium hover:underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Regulamin
            </a>{" "}
            serwisu Staffer.pl *
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand flex-shrink-0 cursor-pointer accent-brand"
          />
          <span className="text-xs text-brand-dark-muted leading-relaxed">
            Zapoznałem/am się z{" "}
            <a
              href="/polityka-prywatnosci"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-brand-light font-medium hover:underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Polityką Prywatności
            </a>{" "}
            i wyrażam zgodę na przetwarzanie moich danych osobowych *
          </span>
        </label>

        <p className="text-[10px] text-brand-dark-soft">* Pola wymagane</p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !termsAccepted || !privacyAccepted}
      >
        {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
      </Button>

      {/* Separator */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-brand-warm"></div>
        <span className="flex-shrink mx-4 text-brand-dark-muted text-sm">LUB</span>
        <div className="flex-grow border-t border-brand-warm"></div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full bg-white text-brand-dark border border-brand-warm hover:bg-brand-warm-light flex items-center justify-center gap-2 transition-colors duration-150"
      >
        <GoogleIcon />
        Zarejestruj się przez Google
      </Button>

      <p className="text-sm text-center text-brand-dark-muted">
        Masz już konto?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-brand hover:text-brand-light cursor-pointer transition-colors duration-150 hover:underline font-medium"
        >
          Zaloguj się
        </button>
      </p>
    </form>
  );
}

