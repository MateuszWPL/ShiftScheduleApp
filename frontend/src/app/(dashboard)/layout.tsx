"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardGate } from "@/hooks/useDashboardGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardUserProvider } from "@/components/providers/DashboardUserContext";
import { UnverifiedView } from "@/components/auth/UnverifiedView";
import { PendingView } from "@/components/onboarding/PendingView";
import { useLogout } from "@/hooks/useLogout";
import { getAvatarUrl } from "@/lib/api";
import { authPaths } from "@/lib/app-paths";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = useDashboardGate();
  const logout = useLogout();
  const router = useRouter();

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("session-invalidated", handler);
    return () => window.removeEventListener("session-invalidated", handler);
  }, [logout]);

  useEffect(() => {
    if (gate.status === "unauthenticated") {
      router.replace(authPaths.login);
    }
  }, [gate.status, router]);

  useEffect(() => {
    if (gate.status === "onboarding" && gate.dbUser) {
      router.replace(authPaths.onboarding);
    }
  }, [gate.status, gate.dbUser, router]);

  if (gate.status === "loading" || gate.status === "syncing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-brand-warm border-t-brand rounded-full mx-auto" />
          <p className="text-sm text-brand-dark-muted">
            {gate.status === "syncing" ? "Ładujemy Twoje konto..." : "Ładowanie..."}
          </p>
        </div>
      </div>
    );
  }

  if (gate.status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-brand-warm border-t-brand rounded-full mx-auto" />
          <p className="text-sm text-brand-dark-muted">Przekierowywanie do logowania...</p>
        </div>
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
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-brand-warm border-t-brand rounded-full mx-auto" />
          <p className="text-sm text-brand-dark-muted">Przekierowywanie do onboardingu...</p>
        </div>
      </div>
    );
  }

  if (gate.status !== "ready" || !gate.dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <p className="text-sm text-brand-dark-muted">Przygotowujemy pulpit...</p>
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
