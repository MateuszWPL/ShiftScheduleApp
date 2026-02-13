"use client";

import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DostepnoscPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();

  useEffect(() => {
    if (dbUser && dbUser.role !== "EMPLOYEE") {
      router.replace("/");
    }
  }, [dbUser, router]);

  if (!dbUser || dbUser.role !== "EMPLOYEE") {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-500">
        <p>Przekierowuję...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Moja dostępność</h1>
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-600">
        <p className="mb-2">Tutaj ustawisz swoją dostępność na dany tydzień.</p>
        <p className="text-sm">Widok w przygotowaniu — min. 4 godziny na slot.</p>
      </div>
    </div>
  );
}
