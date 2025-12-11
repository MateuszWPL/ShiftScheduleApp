"use client";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

function ResetPasswordContent() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Reset hasła</h1>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <p className="text-center">Ładowanie...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

