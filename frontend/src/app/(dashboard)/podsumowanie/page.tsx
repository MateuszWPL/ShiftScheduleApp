"use client";

import { useState } from "react";
import { SummaryPanel } from "@/components/dashboard/SummaryPanel";
import { MonthlyCalendarView } from "@/components/dashboard/MonthlyCalendarView";
import { Button } from "@/components/ui/button";
import { BarChart3, LayoutGrid, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export default function PodsumowaniePage() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => new Date());

  const monday = getWeekMonday(weekStart);
  const toDate = new Date(monday);
  toDate.setDate(toDate.getDate() + 7);

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

  const summaryFrom = viewMode === "week" ? monday.toISOString() : monthStart.toISOString();
  const summaryTo = viewMode === "week" ? toDate.toISOString() : monthEnd.toISOString();
  const summaryLabel =
    viewMode === "week"
      ? `${monday.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} – ${toDate.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}`
      : monthDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Podsumowanie</h1>
          <p className="text-xs text-brand-dark/40">Godziny pracowników i przegląd grafiku</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="inline-flex rounded-lg border border-brand-warm/40 bg-white p-0.5">
          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "week" ? "bg-brand text-white" : "text-brand-dark/60 hover:text-brand-dark"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Tydzień
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "month" ? "bg-brand text-white" : "text-brand-dark/60 hover:text-brand-dark"
            }`}
          >
            <CalendarRange className="h-4 w-4" />
            Miesiąc
          </button>
        </div>

        {viewMode === "week" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-brand-warm/60 hover:bg-brand-warm-light h-8 w-8"
              onClick={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setWeekStart(prev);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-brand-dark min-w-[160px] text-center">
              {summaryLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="border-brand-warm/60 hover:bg-brand-warm-light h-8 w-8"
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {viewMode === "month" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-brand-warm/60 hover:bg-brand-warm-light h-8 w-8"
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-brand-dark min-w-[140px] text-center">
              {monthDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="border-brand-warm/60 hover:bg-brand-warm-light h-8 w-8"
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-brand"
              onClick={() => setMonthDate(new Date())}
            >
              Dziś
            </Button>
          </div>
        )}
      </div>

      <SummaryPanel from={summaryFrom} to={summaryTo} periodLabel={summaryLabel} />

      {viewMode === "month" && (
        <div>
          <h3 className="text-sm font-semibold text-brand-dark mb-3">Kalendarz miesięczny</h3>
          <MonthlyCalendarView monthDate={monthDate} />
        </div>
      )}
    </div>
  );
}
