"use client";

import { useQuery } from "@tanstack/react-query";
import { getShifts, type Shift } from "@/lib/api";

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getMonthEnd(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Padded calendar: weeks start on Monday, pad empty cells at start */
function getCalendarDays(monthStart: Date): (Date | null)[] {
  const days: (Date | null)[] = [];
  const first = monthStart.getDay();
  const padStart = first === 0 ? 6 : first - 1;

  for (let i = 0; i < padStart; i++) {
    days.push(null);
  }

  const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), d));
  }

  return days;
}

interface MonthlyCalendarViewProps {
  monthDate: Date;
  onDayClick?: (dateKey: string) => void;
}

export function MonthlyCalendarView({ monthDate, onDayClick }: MonthlyCalendarViewProps) {
  const monthStart = getMonthStart(monthDate);
  const monthEnd = getMonthEnd(monthDate);
  const from = monthStart.toISOString();
  const to = monthEnd.toISOString();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts", from, to],
    queryFn: () => getShifts({ from, to }),
  });

  const shiftsByDate = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const d = new Date(shift.startTime);
    const key = toLocalDateKey(d);
    const list = shiftsByDate.get(key) ?? [];
    list.push(shift);
    shiftsByDate.set(key, list);
  }

  const calendarDays = getCalendarDays(monthStart);
  const WEEKDAYS = ["Pn", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  if (isLoading) {
    return (
      <div className="bg-white border border-brand-warm/40 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-12 text-brand-dark/40">
          <div className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-warm/40 rounded-xl p-4 sm:p-6 shadow-sm overflow-x-auto">
      <div className="min-w-[320px]">
        <div className="grid grid-cols-7 gap-px mb-2">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-[10px] sm:text-xs font-semibold text-brand-dark/50 uppercase py-1"
            >
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((d, i) => {
            if (!d) {
              return <div key={`empty-${i}`} className="aspect-square min-h-[36px] sm:min-h-[44px] bg-transparent" />;
            }
            const key = toLocalDateKey(d);
            const dayShifts = shiftsByDate.get(key) ?? [];
            const hasDraft = dayShifts.some((s) => s.status === "DRAFT");
            const publishedCount = dayShifts.filter((s) => s.status === "PUBLISHED" || s.status === "COMPLETED").length;

            return (
              <div
                key={key}
                className={`aspect-square min-h-[36px] sm:min-h-[44px] p-1 rounded-lg border border-brand-warm/20 bg-brand-warm-light/20 flex flex-col items-center justify-center cursor-default ${
                  onDayClick ? "hover:bg-brand-muted/30 cursor-pointer" : ""
                }`}
                onClick={() => onDayClick?.(key)}
              >
                <span className="text-xs sm:text-sm font-medium text-brand-dark">{d.getDate()}</span>
                {(dayShifts.length > 0) && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {hasDraft && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Szkice" />
                    )}
                    {publishedCount > 0 && (
                      <span className="text-[9px] text-brand-dark/50">{dayShifts.length} zm.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
