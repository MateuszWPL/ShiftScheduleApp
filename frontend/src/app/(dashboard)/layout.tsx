"use client";

import { useDashboardGate } from "@/hooks/useDashboardGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardUserProvider } from "@/components/providers/DashboardUserContext";
import { Navbar } from "@/components/layout/Navbar";
import { LoginPage } from "@/components/auth/LoginPage";
import { UnverifiedView } from "@/components/auth/UnverifiedView";
import { PendingView } from "@/components/onboarding/PendingView";
import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { useLogout } from "@/hooks/useLogout";
import { getAvatarUrl } from "@/lib/api";
import { useState, useEffect } from "react";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = useDashboardGate();
  const logout = useLogout();
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | undefined>(undefined);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("session-invalidated", handler);
    return () => window.removeEventListener("session-invalidated", handler);
  }, [logout]);

  if (gate.status === "loading" || gate.status === "syncing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full mx-auto" />
          <p className="text-sm text-gray-600">
            {gate.status === "syncing" ? "Ładujemy Twoje konto..." : "Ładowanie..."}
          </p>
        </div>
      </div>
    );
  }

  if (gate.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar
          onLoginClick={() => setAuthMode("login")}
          onRegisterClick={() => setAuthMode("register")}
        />
        <LoginPage initialMode={authMode} onModeChange={setAuthMode} />
      </div>
    );
  }

  if (gate.status === "unverified" && gate.dbUser) {
    return (
      <UnverifiedView
        email={gate.dbUser.email}
        userName={gate.dbUser.name || "Użytkownik"}
      />
    );
  }

  if (gate.status === "pending" && gate.dbUser) {
    return (
      <PendingView
        userName={gate.dbUser.name || "Użytkownik"}
        onLogout={logout}
      />
    );
  }

  if (gate.status === "onboarding" && gate.dbUser) {
    return (
      <OnboardingView
        userId={gate.dbUser.id}
        userName={gate.dbUser.name}
        onSuccess={(user) => {
          gate.setDbUser(user);
          if (user.membershipStatus === "PENDING") {
            gate.invalidateQueries();
          }
        }}
        onLogout={logout}
      />
    );
  }

  if (gate.status !== "ready" || !gate.dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-gray-600">Przygotowujemy pulpit...</p>
      </div>
    );
  }

  const user = gate.currentUser || gate.dbUser;

  return (
    <DashboardUserProvider
      value={{
        dbUser: gate.dbUser,
        currentUser: user,
        setDbUser: gate.setDbUser,
        invalidateQueries: gate.invalidateQueries,
      }}
    >
      <DashboardLayout
        userRole={user?.role || gate.dbUser?.role}
        userName={user?.name || gate.dbUser?.name}
        userAvatar={getAvatarUrl(user?.avatarUrl || gate.dbUser?.avatarUrl) || null}
        onLogout={logout}
      >
        {children}
      </DashboardLayout>
    </DashboardUserProvider>
  );
}
