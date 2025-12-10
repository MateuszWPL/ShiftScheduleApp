"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { signIn } from "next-auth/react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function LoginPage() {
  const [mode, setMode] = useState<"choose" | "login" | "register">("choose");

  if (mode === "login") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Zaloguj się</h1>
          <LoginForm onSwitchToRegister={() => setMode("register")} />
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMode("choose")}
            >
              Wróć do wyboru
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Zarejestruj się</h1>
          <RegisterForm onSwitchToLogin={() => setMode("login")} />
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMode("choose")}
            >
              Wróć do wyboru
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center space-y-6">
        <h1 className="text-2xl font-bold">Staffer.pl</h1>
        <p className="text-gray-600">Wybierz metodę logowania</p>

        <div className="space-y-3">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5" />
            Zaloguj przez Google
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">LUB</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <Button
            onClick={() => setMode("login")}
            variant="outline"
            className="w-full"
          >
            Email i Hasło
          </Button>
        </div>

        <p className="text-sm text-gray-500">
          Nie masz konta?{" "}
          <button
            onClick={() => setMode("register")}
            className="text-blue-600 hover:underline"
          >
            Zarejestruj się
          </button>
        </p>
      </div>
    </div>
  );
}

