"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { RequestPasswordResetForm } from "./RequestPasswordResetForm";
import { LoginWelcomeIllustration } from "@/components/brand/illustrations";

interface LoginPageProps {
  initialMode?: "login" | "register" | "reset";
  onModeChange?: (mode: "login" | "register" | "reset") => void;
}

export function LoginPage({ initialMode, onModeChange }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register" | "reset" | null>(initialMode || null);

  // Synchronizuj wewnętrzny state z propem
  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleModeChange = (newMode: "login" | "register" | "reset") => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  // Jeśli nie wybrano trybu, nie pokazuj nic (navbar będzie widoczny)
  if (!mode) {
    return null;
  }

  if (mode === "login") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-brand-warm/50">
          <div className="flex justify-center mb-6">
            <LoginWelcomeIllustration className="max-h-[80px]" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6 text-brand-dark">Zaloguj się</h1>
          <LoginForm 
            onSwitchToRegister={() => handleModeChange("register")} 
            onSwitchToReset={() => handleModeChange("reset")}
          />
        </div>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-brand-warm/50">
          <h1 className="text-2xl font-bold text-center mb-6 text-brand-dark">Reset hasła</h1>
          <RequestPasswordResetForm onBack={() => handleModeChange("login")} />
        </div>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-brand-warm/50">
          <div className="flex justify-center mb-6">
            <LoginWelcomeIllustration className="max-h-[80px]" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6 text-brand-dark">Zarejestruj się</h1>
          <RegisterForm onSwitchToLogin={() => handleModeChange("login")} />
        </div>
      </div>
    );
  }

  return null;
}

