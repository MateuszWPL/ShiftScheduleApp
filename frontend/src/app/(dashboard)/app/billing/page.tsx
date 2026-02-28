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
import {
  CreditCard,
  Crown,
  ExternalLink,
  Check,
  Sparkles,
  Building2,
} from "lucide-react";

const PLAN_INFO: Record<
  string,
  { label: string; price: string; color: string; icon: React.ReactNode }
> = {
  free: {
    label: "Darmowy",
    price: "0 zł",
    color: "text-brand-dark-soft",
    icon: <Sparkles className="h-6 w-6 text-brand-dark-soft" />,
  },
  starter: {
    label: "Starter",
    price: "29 zł/mies.",
    color: "text-brand-blue",
    icon: <Crown className="h-6 w-6 text-brand-blue" />,
  },
  business: {
    label: "Business",
    price: "79 zł/mies.",
    color: "text-brand",
    icon: <Building2 className="h-6 w-6 text-brand" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Aktywny", cls: "bg-success-muted text-success" },
    trialing: {
      label: "Okres próbny",
      cls: "bg-brand-blue-muted text-brand-blue",
    },
    past_due: { label: "Zaległy", cls: "bg-warning-muted text-warning" },
    canceled: { label: "Anulowany", cls: "bg-error-muted text-error" },
    free: {
      label: "Darmowy",
      cls: "bg-brand-warm text-brand-dark-muted",
    },
  };
  const info = map[status] ?? map.free;
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${info.cls}`}
    >
      {info.label}
    </span>
  );
}

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
      toast.success("Płatność zakończona pomyślnie!");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
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

  const currentPlan = subscription?.planId ?? "free";
  const info = PLAN_INFO[currentPlan] ?? PLAN_INFO.free;
  const status = subscription?.status ?? "free";
  const isActiveSub = status === "active" || status === "trialing";
  const hasPaidPlan = currentPlan === "starter" || currentPlan === "business";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
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
        <div className="space-y-8">
          {/* Current plan card */}
          <div className="p-6 rounded-2xl border border-brand-warm bg-white shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-muted/50 flex items-center justify-center">
                  {info.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark text-lg">
                      Plan {info.label}
                    </span>
                    {hasPaidPlan && (
                      <span className="text-xs font-medium text-brand bg-brand-muted px-2 py-0.5 rounded-full">
                        {info.price}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-dark-muted mt-0.5">
                    {isActiveSub && subscription?.currentPeriodEnd
                      ? `Odnawia się ${new Date(subscription.currentPeriodEnd).toLocaleDateString("pl-PL")}`
                      : null}
                  </p>
                </div>
              </div>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Upgrade section — show when no paid plan */}
          {!hasPaidPlan && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                Wybierz plan
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Starter card */}
                <div className="p-5 rounded-2xl border-2 border-brand-blue/30 bg-gradient-to-b from-brand-blue-muted/30 to-white hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-5 w-5 text-brand-blue" />
                    <span className="font-bold text-brand-dark">Starter</span>
                    <span className="text-xs font-medium text-brand-blue bg-brand-blue-muted px-2 py-0.5 rounded-full ml-auto">
                      14 dni za darmo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-brand-dark">
                      29
                    </span>
                    <span className="text-sm text-brand-dark-muted">
                      zł / mies.
                    </span>
                  </div>
                  <ul className="space-y-1.5 mb-5 text-sm text-brand-dark-muted">
                    {[
                      "Do 15 pracowników",
                      "Raporty i analizy",
                      "Eksport PDF / Excel",
                      "Google Calendar / iCal",
                      "Priorytetowe wsparcie",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={async () => {
                      try {
                        const { url } = await createCheckoutSession();
                        if (url) window.location.href = url;
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Błąd"
                        );
                      }
                    }}
                    className="w-full bg-brand-dark hover:bg-brand-dark-light text-white gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Wypróbuj Starter
                  </Button>
                </div>

                {/* Business card */}
                <div className="p-5 rounded-2xl border-2 border-brand/40 bg-gradient-to-b from-brand-muted/40 to-white hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg relative">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold bg-brand text-white rounded-full">
                    Najpopularniejszy
                  </span>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-brand" />
                    <span className="font-bold text-brand-dark">Business</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-brand-dark">
                      79
                    </span>
                    <span className="text-sm text-brand-dark-muted">
                      zł / mies.
                    </span>
                  </div>
                  <ul className="space-y-1.5 mb-5 text-sm text-brand-dark-muted">
                    {[
                      "Bez limitu pracowników",
                      "Wszystko ze Startera",
                      "Szablony grafiku",
                      "Wiele lokalizacji",
                      "Zaawansowane role",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={async () => {
                      try {
                        const priceId =
                          process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? undefined;
                        const { url } = await createCheckoutSession(priceId);
                        if (url) window.location.href = url;
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Błąd"
                        );
                      }
                    }}
                    className="w-full bg-brand hover:bg-brand-light text-white gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Wybierz Business
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Manage subscription — show when paid */}
          {hasPaidPlan && subscription?.stripeCustomerId && (
            <div className="flex flex-col sm:flex-row gap-3">
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
            </div>
          )}

          {/* Note for free users */}
          {!hasPaidPlan && (
            <p className="text-xs text-brand-dark-soft text-center">
              Po kliknięciu przycisku zostaniesz przekierowany do bezpiecznej
              strony Stripe. 14 dni za darmo, możesz anulować w dowolnym
              momencie.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
