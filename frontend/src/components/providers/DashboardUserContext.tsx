"use client";

import { createContext, useContext, ReactNode } from "react";

interface DashboardUserContextValue {
  dbUser: any;
  currentUser: any;
  setDbUser: (u: any) => void;
  invalidateQueries: () => void;
}

const DashboardUserContext = createContext<DashboardUserContextValue | null>(null);

export function DashboardUserProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DashboardUserContextValue;
}) {
  return (
    <DashboardUserContext.Provider value={value}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser(): DashboardUserContextValue {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) throw new Error("useDashboardUser must be used inside DashboardUserProvider");
  return ctx;
}
