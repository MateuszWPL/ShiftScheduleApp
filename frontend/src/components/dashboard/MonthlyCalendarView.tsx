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
      <div className="bg-white border border-brand-warm rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-center py-8 text-brand-dark-muted">
          <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const CELL_SIZE = "w-8 h-8"; // Compact 32px cells

  return (
    <div className="bg-white border border-brand-warm rounded-xl p-4 shadow-sm max-w-md w-full min-w-0 overflow-hidden">
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className={`${CELL_SIZE} flex items-center justify-center text-[10px] font-semibold text-brand-dark-muted`}
          >
            {wd}
          </div>
        ))}
        {calendarDays.map((d, i) => {
          if (!d) {
            return <div key={`empty-${i}`} className={CELL_SIZE} />;
          }
          const key = toLocalDateKey(d);
          const dayShifts = shiftsByDate.get(key) ?? [];
          const hasDraft = dayShifts.some((s) => s.status === "DRAFT");
          const count = dayShifts.length;

          return (
            <div
              key={key}
              className={`${CELL_SIZE} flex flex-col items-center justify-center rounded text-[11px] cursor-default ${
                count > 0 ? "bg-brand-muted/40 font-medium" : "text-brand-dark-muted"
              } ${onDayClick ? "hover:bg-brand-muted/60 cursor-pointer" : ""}`}
              onClick={() => onDayClick?.(key)}
              title={count > 0 ? `${count} zmian${count === 1 ? "a" : count < 5 ? "y" : ""}` : undefined}
            >
              <span className="leading-none">{d.getDate()}</span>
              {count > 0 && (
                <span className="text-[9px] leading-none mt-0.5 flex items-center gap-0.5">
                  {hasDraft && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
