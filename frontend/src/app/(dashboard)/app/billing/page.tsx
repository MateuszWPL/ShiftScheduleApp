"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  getPlanStatus,
  changePlan,
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
  ArrowRight,
  Shield,
  AlertTriangle,
  Users,
} from "lucide-react";

/* ───── Plan definitions ───── */

interface PlanDef {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  features: string[];
  gradient: string;
  borderDefault: string;
  borderActive: string;
  iconBg: string;
  iconColor: string;
  ctaClass: string;
  level: number;
}

const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Darmowy",
    subtitle: "Na start i małe zespoły",
    price: "0",
    period: "na zawsze",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      "Do 5 pracowników",
      "Grafik tygodniowy + miesięczny",
      "Giełda zmian",
      "Ogłoszenia zespołowe",
      "Powiadomienia email",
    ],
    gradient: "from-brand-warm/20 to-white",
    borderDefault: "border-brand-warm",
    borderActive: "border-brand-warm ring-2 ring-brand-warm/40",
    iconBg: "bg-brand-warm",
    iconColor: "text-brand-dark",
    ctaClass: "bg-brand-warm hover:bg-brand-warm/80 text-brand-dark",
    level: 0,
  },
  {
    id: "starter",
    name: "Starter+",
    subtitle: "Dla rozwijających się firm",
    price: "29",
    period: "mies.",
    icon: <Crown className="h-5 w-5" />,
    features: [
      "Do 15 pracowników",
      "Raporty godzin i kosztów",
      "Eksport PDF / Excel / CSV",
      "Google Calendar / iCal",
      "Priorytetowe wsparcie",
    ],
    gradient: "from-brand-blue/15 to-white",
    borderDefault: "border-brand-blue/30",
    borderActive: "border-brand-blue ring-2 ring-brand-blue/40",
    iconBg: "bg-brand-blue-muted",
    iconColor: "text-brand-blue",
    ctaClass: "bg-brand-dark hover:bg-brand-dark-light text-white",
    level: 1,
  },
  {
    id: "business",
    name: "Business+",
    subtitle: "Pełna kontrola bez ograniczeń",
    price: "79",
    period: "mies.",
    icon: <Building2 className="h-5 w-5" />,
    features: [
      "Bez limitu pracowników",
      "Szablony grafiku",
      "Wiele lokalizacji",
      "Zaawansowane role",
      "Audit log & push",
    ],
    gradient: "from-brand-muted/30 to-white",
    borderDefault: "border-brand/30",
    borderActive: "border-brand ring-2 ring-brand/40",
    iconBg: "bg-brand-muted",
    iconColor: "text-brand",
    ctaClass: "bg-brand hover:bg-brand-light text-white shadow-md shadow-brand/20",
    level: 2,
  },
];

/* ───── Status badge ───── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Aktywny", cls: "bg-success-muted text-success" },
    trialing: { label: "Okres próbny", cls: "bg-brand-blue-muted text-brand-blue" },
    past_due: { label: "Zaległy", cls: "bg-warning-muted text-warning" },
    canceled: { label: "Anulowany", cls: "bg-error-muted text-error" },
    free: { label: "Darmowy", cls: "bg-brand-warm text-brand-dark-muted" },
  };
  const info = map[status] ?? map.free;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${info.cls}`}>
      {info.label}
    </span>
  );
}

/* ───── Page ───── */

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

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
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

  const currentPlan = planStatus?.planId ?? subscription?.planId ?? "free";
  const currentLevel = PLANS.find((p) => p.id === currentPlan)?.level ?? 0;
  const status = subscription?.status ?? "free";
  const isActiveSub = status === "active" || status === "trialing";
  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  /* ── Upgrade handler ── */
  const handleUpgrade = async (targetPlanId: string) => {
    try {
      const { url } = await createCheckoutSession({ planId: targetPlanId });
      if (url) window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd tworzenia sesji płatności");
    }
  };

  const handleChangePlan = async (targetPlanId: "starter" | "business") => {
    try {
      await changePlan(targetPlanId);
      toast.success("Plan został zaktualizowany!");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd zmiany planu");
    }
  };

  const handlePortal = async () => {
    try {
      const { url } = await createPortalSession();
      if (url) window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd otwarcia portalu");
    }
  };

  /* ── CTA logic per card ── */
  const getCardCta = (plan: PlanDef) => {
    const isCurrentPlan = plan.id === currentPlan;
    const isHigher = plan.level > currentLevel;

    if (isCurrentPlan) {
      return { label: "Aktualny plan", disabled: true, action: () => {} };
    }
    if (isHigher) {
      if (!isActiveSub) {
        // No active subscription — go through Stripe Checkout
        return {
          label: plan.id === "business" ? "Ulepsz do Business+" : "Wypróbuj 14 dni za darmo",
          disabled: false,
          action: () => handleUpgrade(plan.id),
        };
      }
      // Active subscription — redirect to Stripe Portal (user confirms change there)
      return {
        label: `Ulepsz do ${plan.name}`,
        disabled: false,
        action: handlePortal,
      };
    }
    // Lower plan — downgrade zablokowany
    return { label: plan.name, disabled: true, action: () => {} };
  };

  const memberCount = planStatus?.memberCount ?? 0;
  const memberLimit = planStatus?.memberLimit;
  const limitExceeded = planStatus?.limitExceeded ?? false;
  const isPastDue = status === "past_due";

  return (
    <div className="max-w-4xl mx-auto">
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
        <div className="text-sm text-brand-dark-soft text-center py-16">
          Ładowanie...
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Past due warning ── */}
          {isPastDue && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-warning bg-warning-muted">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-dark">
                  Płatność nie powiodła się
                </p>
                <p className="text-xs text-brand-dark-muted mt-0.5">
                  Zaktualizuj kartę płatniczą, aby uniknąć utraty dostępu do funkcji premium.
                  Masz 7 dni na aktualizację.
                </p>
                {hasStripeCustomer && (
                  <button
                    onClick={handlePortal}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-warning hover:text-brand-dark transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Zaktualizuj kartę w Stripe
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Limit exceeded warning ── */}
          {limitExceeded && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-error bg-error-muted">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-dark">
                  Przekroczono limit pracowników
                </p>
                <p className="text-xs text-brand-dark-muted mt-0.5">
                  Twój plan pozwala na {memberLimit} pracowników, a masz ich {memberCount}.
                  Ulepsz plan lub usuń pracowników, aby odblokować pełną funkcjonalność.
                </p>
              </div>
            </div>
          )}

          {/* ── Member usage bar ── */}
          {memberLimit !== null && memberLimit !== undefined && (
            <div className="p-4 rounded-xl border border-brand-warm bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-brand-dark-muted" />
                <span className="text-xs font-semibold text-brand-dark">
                  Pracownicy: {memberCount} / {memberLimit}
                </span>
              </div>
              <div className="h-2 bg-brand-warm rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    memberCount > memberLimit
                      ? "bg-error"
                      : memberCount >= memberLimit * 0.8
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                  style={{ width: `${Math.min((memberCount / memberLimit) * 100, 100)}%` }}
                />
              </div>
              {memberCount >= memberLimit && (
                <p className="text-[10px] text-error mt-1">
                  Osiągnięto limit — nie można dodawać nowych pracowników
                </p>
              )}
            </div>
          )}

          {/* ── Current plan summary bar ── */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl border border-brand-warm bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-brand" />
              <div>
                <span className="font-semibold text-brand-dark text-sm">
                  Plan {PLANS.find((p) => p.id === currentPlan)?.name ?? "Darmowy"}
                </span>
                {isActiveSub && subscription?.currentPeriodEnd && (
                  <span className="text-xs text-brand-dark-soft ml-2">
                    · odnawia się{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("pl-PL")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {hasStripeCustomer && (
                <button
                  onClick={handlePortal}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-light transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Portal Stripe
                </button>
              )}
            </div>
          </div>

          {/* ── 3 Plan cards ── */}
          <div className="grid sm:grid-cols-3 gap-4 lg:gap-5">
            {PLANS.map((plan) => {
              const isActive = plan.id === currentPlan && isActiveSub;
              const isCurrent = plan.id === currentPlan;
              const cta = getCardCta(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-5 transition-all duration-300 bg-gradient-to-b ${plan.gradient} ${
                    isCurrent
                      ? `${plan.borderActive} shadow-lg`
                      : `${plan.borderDefault} shadow-sm hover:-translate-y-0.5 hover:shadow-md`
                  }`}
                >
                  {/* Active badge */}
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold bg-success text-white rounded-full shadow-sm whitespace-nowrap">
                      ✓ Twój plan
                    </span>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan.iconBg} ${plan.iconColor}`}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-brand-dark">
                        {plan.name}
                      </h3>
                      <p className="text-[10px] text-brand-dark-muted leading-tight">
                        {plan.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-0.5 mb-4">
                    <span className="text-3xl font-extrabold text-brand-dark tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm text-brand-dark-muted font-medium">
                      zł
                    </span>
                    <span className="text-xs text-brand-dark-soft ml-0.5">
                      / {plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-brand-dark-muted leading-tight">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={cta.action}
                    disabled={cta.disabled}
                    className={`w-full gap-1.5 text-xs font-semibold transition-all duration-200 ${
                      cta.disabled
                        ? "bg-brand-warm/60 text-brand-dark-soft cursor-default border-0"
                        : `${plan.ctaClass} hover:scale-[1.02] active:scale-[0.98]`
                    }`}
                    variant={cta.disabled ? "ghost" : "default"}
                  >
                    {cta.disabled ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                    {cta.label}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* ── Info note ── */}
          <p className="text-xs text-brand-dark-soft text-center max-w-md mx-auto">
            {hasStripeCustomer
              ? "Zmiana planu i zarządzanie płatnościami odbywa się przez bezpieczny portal Stripe."
              : "Po kliknięciu przycisku zostaniesz przekierowany do bezpiecznej strony Stripe. 14 dni za darmo, możesz anulować w dowolnym momencie."}
          </p>
        </div>
      )}
    </div>
  );
}
