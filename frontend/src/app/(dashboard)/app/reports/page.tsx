"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getHoursReport,
  getCostsReport,
  getComplianceReport,
  getPlanStatus,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import {
  BarChart3,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle,
  Check,
  ChevronDown,
  TrendingUp,
  Users,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

/* ── helpers ── */

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(d);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const RANGE_OPTIONS = [
  { label: "Ten tydzień", value: "this-week" },
  { label: "Ostatni tydzień", value: "last-week" },
  { label: "Ten miesiąc", value: "this-month" },
  { label: "Ostatni miesiąc", value: "last-month" },
  { label: "Ostatnie 90 dni", value: "90-days" },
] as const;

function getRange(value: string): { from: string; to: string } {
  const now = new Date();
  switch (value) {
    case "this-week": {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { from: toISO(start), to: toISO(end) };
    }
    case "last-week": {
      const start = startOfWeek(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { from: toISO(start), to: toISO(end) };
    }
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: toISO(start), to: toISO(end) };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISO(start), to: toISO(end) };
    }
    case "90-days": {
      const end = new Date(now);
      end.setDate(end.getDate() + 1);
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { from: toISO(start), to: toISO(end) };
    }
    default:
      return getRange("this-month");
  }
}

type Tab = "hours" | "costs" | "compliance";

const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: "hours", label: "Godziny", icon: <Clock className="h-4 w-4" /> },
  { id: "costs", label: "Koszty", icon: <DollarSign className="h-4 w-4" />, adminOnly: true },
  { id: "compliance", label: "Zgodność KP", icon: <Shield className="h-4 w-4" /> },
];

/* ── Stat card ── */
function Stat({
  label, value, sub, icon, color = "text-brand",
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-brand-warm bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`${color}`}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wide text-brand-dark-muted font-semibold">
          {label}
        </span>
      </div>
      <p className="text-2xl font-extrabold text-brand-dark tracking-tight">{value}</p>
      {sub && <p className="text-[10px] text-brand-dark-soft mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Bar visualization ── */
function HoursBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 rounded-full bg-brand-warm/50 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Main page ── */

export default function ReportsPage() {
  const { dbUser } = useDashboardUser();
  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";
  const [tab, setTab] = useState<Tab>("hours");
  const [range, setRange] = useState("this-month");

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
  });

  const hasAccess = planStatus?.hasStarter ?? false;
  const dateRange = useMemo(() => getRange(range), [range]);
  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => !t.adminOnly || isAdmin),
    [isAdmin],
  );

  const { data: hoursData, isLoading: hoursLoading } = useQuery({
    queryKey: ["report-hours", dateRange],
    queryFn: () => getHoursReport(dateRange),
    enabled: hasAccess && tab === "hours",
  });

  const { data: costsData, isLoading: costsLoading } = useQuery({
    queryKey: ["report-costs", dateRange],
    queryFn: () => getCostsReport(dateRange),
    enabled: hasAccess && tab === "costs" && isAdmin,
  });

  const { data: compData, isLoading: compLoading } = useQuery({
    queryKey: ["report-compliance", dateRange],
    queryFn: () => getComplianceReport(dateRange),
    enabled: hasAccess && tab === "compliance",
  });

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-muted flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-brand" />
        </div>
        <h2 className="text-lg font-bold text-brand-dark mb-1">
          {isAdmin ? "Raporty i analizy" : "Moje raporty"}
        </h2>
        <p className="text-sm text-brand-dark-muted max-w-sm mb-5">
          Raporty godzin{isAdmin ? ", kosztów" : ""} i zgodności z Kodeksem Pracy dostępne od planu{" "}
          <span className="font-semibold text-brand-blue">Starter+</span>.
        </p>
        <Link
          href={paths.billing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-light text-white text-sm font-medium transition-colors"
        >
          <Crown className="h-4 w-4" />
          Ulepsz plan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">
              {isAdmin ? "Raporty" : "Moje raporty"}
            </h1>
            <p className="text-xs text-brand-dark-muted">
              {isAdmin
                ? "Analizy godzin, kosztów i zgodności z KP"
                : "Twoje godziny i zgodność z Kodeksem Pracy"}
            </p>
          </div>
        </div>

        {/* Range selector */}
        <div className="relative">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-brand-warm bg-white text-sm font-medium text-brand-dark cursor-pointer hover:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-dark-muted pointer-events-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-brand-warm/40 rounded-xl mb-6">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === t.id
                ? "bg-white text-brand shadow-sm"
                : "text-brand-dark-muted hover:text-brand-dark"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "hours" && (
        <HoursTab data={hoursData} loading={hoursLoading} isAdmin={isAdmin} />
      )}
      {tab === "costs" && isAdmin && (
        <CostsTab data={costsData} loading={costsLoading} />
      )}
      {tab === "compliance" && (
        <ComplianceTab data={compData} loading={compLoading} isAdmin={isAdmin} />
      )}
    </div>
  );
}

/* ──────────────────── TAB: GODZINY ──────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HoursTab({ data, loading, isAdmin }: { data: any; loading: boolean; isAdmin: boolean }) {
  if (loading) return <Loading />;
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxHours = Math.max(...(data.employees?.map((e: any) => e.totalHours) ?? [1]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overtimeCount = data.employees?.filter((e: any) => e.overtime > 0).length ?? 0;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className={`grid gap-3 ${isAdmin ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
        <Stat
          label={isAdmin ? "Łączne godziny" : "Twoje godziny"}
          value={data.totalTeamHours}
          icon={<Clock className="h-4 w-4" />}
          sub={`${data.totalTeamShifts} zmian`}
        />
        {isAdmin && (
          <Stat
            label="Pracownicy"
            value={data.employeeCount}
            icon={<Users className="h-4 w-4" />}
            color="text-brand-blue"
          />
        )}
        {isAdmin && (
          <Stat
            label="Średnio / os."
            value={data.employeeCount > 0
              ? Math.round((data.totalTeamHours / data.employeeCount) * 10) / 10
              : 0
            }
            sub="godzin"
            icon={<TrendingUp className="h-4 w-4" />}
            color="text-success"
          />
        )}
        <Stat
          label="Nadgodziny"
          value={isAdmin ? overtimeCount : (data.employees?.[0]?.overtime ?? 0)}
          sub={isAdmin ? "pracowników" : "godzin"}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-warning"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-brand-warm bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-warm/30">
              <th className="text-left p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide">
                {isAdmin ? "Pracownik" : "Imię"}
              </th>
              <th className="text-right p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide">
                Godziny
              </th>
              <th className="text-right p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide hidden sm:table-cell">
                Zmiany
              </th>
              <th className="text-right p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide hidden sm:table-cell">
                Śr. / zmianę
              </th>
              {isAdmin && <th className="p-3 min-w-[120px] hidden md:table-cell" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-warm/50">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.employees?.map((e: any) => (
              <tr key={e.userId} className="hover:bg-brand-warm/10 transition-colors">
                <td className="p-3">
                  <span className="font-medium text-brand-dark">{e.name}</span>
                  {e.overtime > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold text-warning bg-warning-muted px-1.5 py-0.5 rounded-full">
                      +{e.overtime}h
                    </span>
                  )}
                </td>
                <td className="p-3 text-right font-semibold text-brand-dark tabular-nums">
                  {e.totalHours}h
                  {e.maxHours != null && (
                    <span className="text-brand-dark-soft font-normal">
                      {" "}/ {e.maxHours}h
                    </span>
                  )}
                </td>
                <td className="p-3 text-right text-brand-dark-muted tabular-nums hidden sm:table-cell">
                  {e.totalShifts}
                </td>
                <td className="p-3 text-right text-brand-dark-muted tabular-nums hidden sm:table-cell">
                  {e.avgHoursPerShift}h
                </td>
                {isAdmin && (
                  <td className="p-3 hidden md:table-cell">
                    <HoursBar
                      value={e.totalHours}
                      max={maxHours}
                      color={e.overtime > 0 ? "bg-warning" : "bg-brand"}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────────── TAB: KOSZTY ──────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CostsTab({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <Loading />;
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxCost = Math.max(...(data.employees?.map((e: any) => e.totalCost) ?? [1]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="Łączne koszty"
          value={`${data.totalCost.toLocaleString("pl-PL")} zł`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <Stat
          label="Łączne godziny"
          value={data.totalHours}
          sub="godzin"
          icon={<Clock className="h-4 w-4" />}
          color="text-brand-blue"
        />
        <Stat
          label="Śr. stawka"
          value={data.totalHours > 0
            ? `${(Math.round((data.totalCost / data.totalHours) * 100) / 100).toLocaleString("pl-PL")} zł`
            : "0 zł"
          }
          sub="/ godzinę"
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-success"
        />
      </div>

      <div className="rounded-xl border border-brand-warm bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-warm/30">
              <th className="text-left p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide">
                Pracownik
              </th>
              <th className="text-right p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide">
                Stawka
              </th>
              <th className="text-right p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide hidden sm:table-cell">
                Godziny
              </th>
              <th className="text-right p-3 text-xs font-semibold text-brand-dark-muted uppercase tracking-wide">
                Koszt
              </th>
              <th className="p-3 min-w-[100px] hidden md:table-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-warm/50">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.employees?.map((e: any) => (
              <tr key={e.userId} className="hover:bg-brand-warm/10 transition-colors">
                <td className="p-3 font-medium text-brand-dark">{e.name}</td>
                <td className="p-3 text-right text-brand-dark-muted tabular-nums">
                  {e.hourlyRate ? `${e.hourlyRate} zł/h` : "–"}
                </td>
                <td className="p-3 text-right text-brand-dark-muted tabular-nums hidden sm:table-cell">
                  {e.totalHours}h
                </td>
                <td className="p-3 text-right font-semibold text-brand-dark tabular-nums">
                  {e.totalCost.toLocaleString("pl-PL")} zł
                </td>
                <td className="p-3 hidden md:table-cell">
                  <HoursBar
                    value={e.totalCost}
                    max={maxCost}
                    color="bg-brand-blue"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────────── TAB: ZGODNOŚĆ KP ─────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ComplianceTab({ data, loading, isAdmin }: { data: any; loading: boolean; isAdmin: boolean }) {
  if (loading) return <Loading />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className={`grid gap-3 ${isAdmin ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
        {isAdmin && (
          <Stat
            label="Zgodni"
            value={`${data.compliantCount} / ${data.employeeCount}`}
            icon={<Check className="h-4 w-4" />}
            color="text-success"
          />
        )}
        <Stat
          label="Naruszenia"
          value={data.totalViolations}
          icon={<AlertTriangle className="h-4 w-4" />}
          color={data.totalViolations > 0 ? "text-error" : "text-success"}
        />
        <Stat
          label={isAdmin ? "Zgodność" : "Status"}
          value={
            !isAdmin
              ? (data.totalViolations === 0 ? "Zgodny" : "Naruszenia")
              : data.employeeCount > 0
                ? `${Math.round((data.compliantCount / data.employeeCount) * 100)}%`
                : "–"
          }
          icon={<Shield className="h-4 w-4" />}
          color="text-brand"
        />
      </div>

      <div className="space-y-3">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {data.employees?.map((e: any) => (
          <div
            key={e.userId}
            className={`rounded-xl border p-4 transition-all ${
              e.isCompliant
                ? "border-success/20 bg-success-muted/30"
                : "border-error/20 bg-error-muted/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-brand-dark text-sm">{e.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-dark-muted tabular-nums">
                  {e.totalHours}h · {e.totalShifts} zmian
                </span>
                {e.isCompliant ? (
                  <span className="text-[10px] font-bold text-success bg-success-muted px-2 py-0.5 rounded-full">
                    ✓ Zgodny
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-error bg-error-muted px-2 py-0.5 rounded-full">
                    {e.violations.length} {e.violations.length === 1 ? "naruszenie" : "naruszeń"}
                  </span>
                )}
              </div>
            </div>
            {e.violations.length > 0 && (
              <ul className="mt-2 space-y-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {e.violations.map((v: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-error"
                  >
                    <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold">{v.type === "REST_11H" ? "Odpoczynek" : v.type === "WEEKLY_48H" ? "Tygodniówka" : "Max godzin"}:</span>{" "}
                      {v.description}
                      {v.date && <span className="text-error/60 ml-1">({v.date})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-brand-dark-soft">
      Ładowanie raportu...
    </div>
  );
}
