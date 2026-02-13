"use client";

import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PanelPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();

  useEffect(() => {
    if (dbUser && dbUser.role !== "OWNER" && dbUser.role !== "MANAGER") {
      router.replace("/");
    }
  }, [dbUser, router]);

  if (!dbUser) return null;
  if (dbUser.role !== "OWNER" && dbUser.role !== "MANAGER") {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-500">
        <p>Przekierowuję...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Panel Menedżera</h1>
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-600">
        <p className="mb-2">Tu zobaczysz dostępności pracowników i przypiszesz ich do zmian.</p>
        <p className="text-sm">Widok w przygotowaniu — wybór po dniu lub po osobie.</p>
      </div>
    </div>
  );
}
