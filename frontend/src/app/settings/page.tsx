"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSession } from "next-auth/react";
import { useLogout } from "@/hooks/useLogout";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const logout = useLogout();

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout
      userRole={undefined}
      userName={session.user?.name || undefined}
      userAvatar={null}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-slate-600" />
          <h1 className="text-3xl font-bold">Ustawienia firmy</h1>
        </div>

        <Card className="p-6">
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-2">Strona w przygotowaniu</p>
            <p className="text-sm text-gray-500">
              Funkcjonalność ustawień firmy będzie dostępna wkrótce.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

