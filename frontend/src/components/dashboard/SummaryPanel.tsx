"use client";

import { useQuery } from "@tanstack/react-query";
import { getScheduleSummary, type ScheduleSummary, type SummaryEmployee } from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

interface SummaryPanelProps {
  from: string;
  to: string;
  periodLabel: string;
}

export function SummaryPanel({ from, to, periodLabel }: SummaryPanelProps) {
  const { dbUser } = useDashboardUser();
  const isAdmin = dbUser?.role === "ADMIN";

  const { data, isLoading } = useQuery({
    queryKey: ["schedule-summary", from, to],
    queryFn: () => getScheduleSummary({ from, to }),
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-brand-warm rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-brand-dark-muted text-sm">
          <div className="w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
          Ładowanie podsumowania...
        </div>
      </div>
    );
  }

  if (!data || data.employees.length === 0) {
    return (
      <div className="bg-white border border-brand-warm rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
            <Clock className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark">Podsumowanie</h3>
            <p className="text-[11px] text-brand-dark-muted">{periodLabel}</p>
          </div>
        </div>
        <p className="text-sm text-brand-dark-muted">
          {isAdmin ? "Brak pracowników lub zmian w tym okresie." : "Brak Twoich zmian w tym okresie."}
        </p>
        <Link
          href={paths.grafik}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline mt-3"
        >
          Przejdź do grafiku
        </Link>
      </div>
    );
  }

  const withWarnings = data.employees.filter((e) => e.warnings.length > 0);
  const totalHours = data.employees.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="bg-white border border-brand-warm rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
            <Clock className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark">Podsumowanie</h3>
            <p className="text-[11px] text-brand-dark-muted">{periodLabel}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-brand-dark-muted bg-brand-warm-light px-2.5 py-1 rounded-full">
          {isAdmin ? "Łącznie" : "Razem"} {Math.round(totalHours * 10) / 10}h
        </span>
      </div>

      <div className="space-y-2 max-h-[240px] sm:max-h-[280px] overflow-y-auto [-webkit-overflow-scrolling:touch]">
        {data.employees.map((emp) => (
          <EmployeeSummaryRow key={emp.userId} employee={emp} />
        ))}
      </div>

      {withWarnings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-brand-warm">
          <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            {isAdmin
              ? `${withWarnings.length} ${withWarnings.length === 1 ? "pracownik ma" : "pracowników ma"} ostrzeżenia`
              : "Masz ostrzeżenia dotyczące grafiku"}
          </p>
        </div>
      )}
    </div>
  );
}

function EmployeeSummaryRow({ employee }: { employee: SummaryEmployee }) {
  const hasWarnings = employee.warnings.length > 0;
  const overMax = employee.maxHours != null && employee.hours > employee.maxHours;

  return (
    <div
      className={`py-2.5 px-3 rounded-lg border transition-colors ${
        hasWarnings ? "border-amber-200/80 bg-amber-50/50" : "border-brand-warm bg-brand-warm-light/40"
      }`}
      title={hasWarnings ? employee.warnings.join("\n") : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              hasWarnings ? "bg-amber-100 text-amber-700" : "bg-brand-blue-muted text-brand-blue"
            }`}
          >
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-dark truncate">{employee.name}</p>
            {employee.maxHours != null && (
              <p className="text-[10px] text-brand-dark-muted">
                Limit: {employee.maxHours}h{overMax && " (przekroczono)"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-sm font-semibold ${
              overMax ? "text-amber-600" : "text-brand-dark"
            }`}
          >
            {employee.hours}h
          </span>
          {hasWarnings ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
        </div>
      </div>
      {hasWarnings && (
        <p className="text-[10px] text-amber-600 mt-1.5 ml-10 truncate">
          {employee.warnings[0]}
          {employee.warnings.length > 1 && ` (+${employee.warnings.length - 1})`}
        </p>
      )}
    </div>
  );
}
