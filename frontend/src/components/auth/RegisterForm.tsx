"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResendVerificationButton } from "./ResendVerificationButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
          <div className="flex justify-center mb-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-blue-900 mb-2">Sprawdź swoją skrzynkę pocztową!</h3>
          <p className="text-sm text-blue-700 mb-4">
            Wysłaliśmy email weryfikacyjny na adres <strong>{email}</strong>.
            Kliknij link w emailu aby zweryfikować konto.
          </p>
          <ResendVerificationButton email={email} />
          <p className="text-xs text-gray-500 mt-4">
            Po weryfikacji możesz się zalogować.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => onSwitchToLogin()}>
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="twoj@email.pl"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Jan Kowalski"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Minimum 8 znaków"
        />
        <p className="text-xs text-gray-500 mt-1">
          Min. 8 znaków, 1 wielka litera, 1 cyfra
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Potwierdź Hasło
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Powtórz hasło"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
      </Button>

      <p className="text-sm text-center text-gray-600">
        Masz już konto?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline"
        >
          Zaloguj się
        </button>
      </p>
    </form>
  );
}

