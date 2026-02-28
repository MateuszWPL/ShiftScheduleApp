"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { paths } from "@/lib/app-paths";
import { CreditCard, Crown, ExternalLink } from "lucide-react";

export default function BillingPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const isOwner = dbUser?.role === "OWNER";

  useEffect(() => {
    if (dbUser && !isOwner) {
      router.replace(paths.home);
    }
  }, [dbUser, isOwner, router]);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    enabled: isOwner,
  });

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      toast.success("Płatność zakończona pomyślnie");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      router.replace(paths.billing, { scroll: false });
    }
    if (canceled === "1") {
      toast.info("Płatność anulowana");
      router.replace(paths.billing, { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-brand-dark-muted">
        Przekierowuję...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Rozliczenia</h1>
          <p className="text-xs text-brand-dark-muted">
            Zarządzaj subskrypcją i płatnościami zespołu
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-brand-dark-soft text-center py-12">
          Ładowanie...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-brand-warm bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-6 w-6 text-brand" />
              <span className="font-semibold text-brand-dark text-lg">
                {subscription?.planId === "pro" ? "Plan Pro" : "Plan Darmowy"}
              </span>
              {subscription?.planId === "pro" && (
                <span className="text-sm font-medium text-brand bg-brand-muted px-2.5 py-0.5 rounded-full">
                  29 zł/mies.
                </span>
              )}
            </div>
            <p className="text-sm text-brand-dark-muted">
              {subscription?.status === "active" ||
              subscription?.status === "trialing"
                ? subscription?.currentPeriodEnd
                  ? `Aktywny do ${new Date(subscription.currentPeriodEnd).toLocaleDateString("pl-PL")}`
                  : "Aktywny"
                : subscription?.status === "canceled" ||
                    subscription?.status === "past_due"
                  ? "Anulowany lub zaległy"
                  : "Brak aktywnej subskrypcji płatnej"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {subscription?.planId !== "pro" && (
              <Button
                onClick={async () => {
                  try {
                    const { url } = await createCheckoutSession();
                    if (url) window.location.href = url;
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Błąd");
                  }
                }}
                className="gap-2 bg-brand hover:bg-brand-light text-white"
              >
                <Crown className="h-4 w-4" />
                Ulepsz do Pro
              </Button>
            )}
            {subscription?.stripeCustomerId && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const { url } = await createPortalSession();
                    if (url) window.location.href = url;
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Błąd");
                  }
                }}
                className="gap-2 border-brand-warm text-brand-dark-muted hover:text-brand hover:border-brand/30"
              >
                <ExternalLink className="h-4 w-4" />
                Zarządzaj subskrypcją
              </Button>
            )}
          </div>

          {!subscription?.stripeCustomerId && subscription?.planId === "free" && (
            <p className="text-xs text-brand-dark-soft">
              Po kliknięciu „Ulepsz do Pro” zostaniesz przekierowany do
              bezpiecznej strony Stripe w celu dokonania płatności.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
