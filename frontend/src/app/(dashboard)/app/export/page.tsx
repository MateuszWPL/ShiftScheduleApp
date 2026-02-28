"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlanStatus, getAuthToken } from "@/lib/api";
import {
  FileDown,
  Calendar,
  Clock,
  Users,
  Download,
  ChevronDown,
  Crown,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

/* ── helpers ── */

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const r = new Date(d);
  r.setDate(diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
function toISO(d: Date) { return d.toISOString().slice(0, 10); }

const RANGE_OPTIONS = [
  { label: "Ten tydzień", value: "this-week" },
  { label: "Ostatni tydzień", value: "last-week" },
  { label: "Ten miesiąc", value: "this-month" },
  { label: "Ostatni miesiąc", value: "last-month" },
  { label: "Ostatnie 90 dni", value: "90-days" },
] as const;

function getRange(v: string) {
  const now = new Date();
  switch (v) {
    case "this-week": { const s = startOfWeek(now); const e = new Date(s); e.setDate(e.getDate() + 7); return { from: toISO(s), to: toISO(e) }; }
    case "last-week": { const s = startOfWeek(now); s.setDate(s.getDate() - 7); const e = new Date(s); e.setDate(e.getDate() + 7); return { from: toISO(s), to: toISO(e) }; }
    case "this-month": { const s = new Date(now.getFullYear(), now.getMonth(), 1); const e = new Date(now.getFullYear(), now.getMonth() + 1, 1); return { from: toISO(s), to: toISO(e) }; }
    case "last-month": { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 1); return { from: toISO(s), to: toISO(e) }; }
    case "90-days": { const e = new Date(now); e.setDate(e.getDate() + 1); const s = new Date(now); s.setDate(s.getDate() - 90); return { from: toISO(s), to: toISO(e) }; }
    default: return getRange("this-month");
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function downloadCsv(endpoint: string, filename: string) {
  const token = await getAuthToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Błąd eksportu");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Export card ── */

function ExportCard({
  icon, title, description, loading, onExport,
  secondaryAction
}: {
  icon: React.ReactNode; title: string; description: string;
  loading: boolean; onExport: () => void;
  secondaryAction?: { label: string; icon: React.ReactNode; onClick: () => void; loading?: boolean };
}) {
  return (
    <div className="p-5 rounded-xl border border-brand-warm bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-brand-dark mb-1">{title}</h3>
          <p className="text-xs text-brand-dark-muted leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 flex-shrink-0 mt-3 sm:mt-0">
          <button
            onClick={onExport}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 w-full sm:w-auto rounded-lg bg-brand hover:bg-brand-light text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            {loading ? "Eksport..." : "Pobierz CSV"}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 w-full sm:w-auto rounded-lg bg-white border border-brand-warm hover:bg-brand-warm-light hover:border-brand/30 text-brand-dark text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryAction.icon}
              {secondaryAction.loading ? "Ładowanie..." : secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */

export default function ExportPage() {
  const [range, setRange] = useState("this-month");
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
  });

  const hasAccess = planStatus?.hasStarter ?? false;
  const dateRange = useMemo(() => getRange(range), [range]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSchedule = async () => {
    setLoadingSchedule(true);
    try {
      await downloadCsv(
        `/export/schedule-csv?from=${dateRange.from}&to=${dateRange.to}`,
        `grafik_${dateRange.from}_${dateRange.to}.csv`,
      );
      showSuccess("Grafik wyeksportowany!");
    } catch { /* ignore */ }
    setLoadingSchedule(false);
  };

  const handleHours = async () => {
    setLoadingHours(true);
    try {
      await downloadCsv(
        `/export/hours-csv?from=${dateRange.from}&to=${dateRange.to}`,
        `raport_godzin_${dateRange.from}_${dateRange.to}.csv`,
      );
      showSuccess("Raport godzin wyeksportowany!");
    } catch { /* ignore */ }
    setLoadingHours(false);
  };

  const handleEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadCsv(`/export/employees-csv`, `pracownicy_${today}.csv`);
      showSuccess("Lista pracowników wyeksportowana!");
    } catch { /* ignore */ }
    setLoadingEmployees(false);
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-muted flex items-center justify-center mb-4">
          <FileDown className="h-8 w-8 text-brand" />
        </div>
        <h2 className="text-lg font-bold text-brand-dark mb-1">Eksport danych</h2>
        <p className="text-sm text-brand-dark-muted max-w-sm mb-5">
          Eksport grafiku, raportów godzin i listy pracowników dostępny od planu{" "}
          <span className="font-semibold text-brand-blue">Starter</span>.
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
            <FileDown className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Eksport danych</h1>
            <p className="text-xs text-brand-dark-muted">
              Pobierz dane w formacie CSV
            </p>
          </div>
        </div>

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

      {/* Success toast */}
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-muted border border-success/20 text-success text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Export cards */}
      <div className="space-y-3">
        <ExportCard
          icon={<Calendar className="h-5 w-5 text-brand" />}
          title="Grafik zmian"
          description="Eksport opublikowanych zmian z przypisaniami pracowników, stanowiskami i godzinami. Format gotowy do wydruku lub wgrania do systemu kadrowego."
          loading={loadingSchedule}
          onExport={handleSchedule}
          secondaryAction={{
            label: "Drukuj / PDF",
            icon: <FileDown className="h-3.5 w-3.5" />,
            onClick: () => {
              window.open(`/print/schedule?from=${dateRange.from}&to=${dateRange.to}`, "_blank");
            }
          }}
        />

        <ExportCard
          icon={<Clock className="h-5 w-5 text-brand-blue" />}
          title="Raport godzin pracy"
          description="Podsumowanie godzin per pracownik: stawka, koszt, nadgodziny. Idealny do rozliczeń i ewidencji czasu pracy."
          loading={loadingHours}
          onExport={handleHours}
        />

        <ExportCard
          icon={<Users className="h-5 w-5 text-success" />}
          title="Lista pracowników"
          description="Aktualna lista członków zespołu: imię, email, rola, stawka godzinowa. Eksport niezależny od wybranego okresu."
          loading={loadingEmployees}
          onExport={handleEmployees}
        />
      </div>

      <p className="text-[10px] text-brand-dark-soft mt-4 text-center">
        Pliki CSV są kodowane w UTF-8 z BOM i używają separatora &quot;;&quot; — otwierają się poprawnie w Excel.
      </p>
    </div>
  );
}
