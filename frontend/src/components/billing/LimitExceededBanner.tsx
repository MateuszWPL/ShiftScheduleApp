"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlanStatus } from "@/lib/api";
import { AlertTriangle, Crown } from "lucide-react";
import Link from "next/link";
import { paths } from "@/lib/app-paths";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";

/**
 * Globalny banner wyświetlany gdy zespół przekracza limit pracowników
 * dla aktualnego planu. Blokuje kluczowe akcje (tworzenie zmian, publikacja)
 * ale pozwala na przeglądanie, ustawienia, billing i usuwanie pracowników.
 */
export function LimitExceededBanner() {
  const { dbUser } = useDashboardUser();
  const isOwner = dbUser?.role === "OWNER";

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
    staleTime: 30_000,
  });

  if (!planStatus?.limitExceeded) return null;

  const planNames: Record<string, string> = {
    free: "Darmowy",
    starter: "Starter+",
    business: "Business+",
  };

  return (
    <div className="bg-error/10 border-b-2 border-error px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-dark">
            Przekroczono limit pracowników
          </p>
          <p className="text-xs text-brand-dark-muted mt-0.5">
            Plan {planNames[planStatus.planId] ?? planStatus.planId} pozwala na{" "}
            {planStatus.memberLimit} pracowników, a masz ich{" "}
            {planStatus.memberCount}. Tworzenie zmian i publikacja grafiku są
            zablokowane.
          </p>
          <div className="flex items-center gap-3 mt-2">
            {isOwner && (
              <Link
                href={paths.billing}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-light transition-colors"
              >
                <Crown className="h-3 w-3" />
                Ulepsz plan
              </Link>
            )}
            <Link
              href={paths.team}
              className="text-xs font-medium text-brand-dark-muted hover:text-brand-dark transition-colors"
            >
              Zarządzaj zespołem →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
