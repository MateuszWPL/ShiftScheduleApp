"use client";

import { Button } from "@/components/ui/button";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { signOut } from "next-auth/react";

interface UnverifiedViewProps {
  email: string;
  userName: string;
}

export function UnverifiedView({ email, userName }: UnverifiedViewProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-yellow-50 rounded-full">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Zweryfikuj swój email</h1>
          <p className="text-gray-600">
            Witaj, {userName}!
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-left">
          <p className="text-sm text-blue-900 mb-2">
            Aby korzystać z aplikacji, musisz zweryfikować swój adres email.
          </p>
          <p className="text-sm text-blue-700">
            Wysłaliśmy email weryfikacyjny na adres <strong>{email}</strong>.
            Kliknij link w emailu aby zweryfikować konto.
          </p>
        </div>

        <div className="space-y-3">
          <ResendVerificationButton email={email} />
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            Wyloguj się
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Po weryfikacji emaila będziesz mógł zalogować się ponownie i korzystać z aplikacji.
        </p>
      </div>
    </div>
  );
}

