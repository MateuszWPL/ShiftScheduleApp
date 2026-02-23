"use client";

import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getMyAvailability,
  createAvailabilitySlots,
  deleteAvailabilitySlot,
  type AvailabilitySlot,
} from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, Check, Clock, Info, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import {
  TimeBlockStrip,
  type TimeBlock,
  minutesToTime,
} from "@/components/dashboard/TimeBlockStrip";

const MIN_BLOCK_MINUTES = 4 * 60;
const DAY_NAMES = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const DAY_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildWeekRange(monday: Date): { from: string; to: string } {
  const from = new Date(monday);
  const to = new Date(monday);
  to.setDate(to.getDate() + 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

function slotToMinutes(s: AvailabilitySlot): { startMin: number; endMin: number } {
  const startMatch = s.startDateTime.match(/T(\d{2}):(\d{2})/);
  const endMatch = s.endDateTime.match(/T(\d{2}):(\d{2})/);

  const startMin = startMatch
    ? parseInt(startMatch[1]) * 60 + parseInt(startMatch[2])
    : 0;
  const endMin = endMatch
    ? parseInt(endMatch[1]) * 60 + parseInt(endMatch[2])
    : 0;

  return { startMin, endMin };
}

function slotToDateStr(s: AvailabilitySlot): string {
  return s.startDateTime.slice(0, 10);
}

export default function DostepnoscPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()));
  const [weekDrafts, setWeekDrafts] = useState<Map<number, TimeBlock[]>>(
    () => new Map()
  );

  useEffect(() => {
    if (dbUser && dbUser.role !== "EMPLOYEE") {
      router.replace("/");
    }
  }, [dbUser, router]);

  const { from, to } = useMemo(() => buildWeekRange(weekStart), [weekStart]);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["availability-me", from, to],
    queryFn: () => getMyAvailability({ from, to }),
    enabled: !!dbUser && dbUser.role === "EMPLOYEE",
  });

  const createMutation = useMutation({
    mutationFn: createAvailabilitySlots,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-me"] });
      toast.success("Dostępność zapisana");
      setWeekDrafts(new Map());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-me"] });
      toast.success("Slot usunięty");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const blocksByDay = useMemo(() => {
    const map = new Map<number, TimeBlock[]>();
    const monday = new Date(weekStart);
    monday.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) map.set(i, []);

    for (const slot of slots) {
      const slotDateStr = slotToDateStr(slot);
      let dayIndex = -1;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        if (toLocalDateStr(d) === slotDateStr) {
          dayIndex = i;
          break;
        }
      }
      if (dayIndex >= 0) {
        const { startMin, endMin } = slotToMinutes(slot);
        map.get(dayIndex)!.push({ id: slot.id, startMin, endMin });
      }
    }

    for (const arr of map.values()) {
      arr.sort((a, b) => a.startMin - b.startMin);
    }
    return map;
  }, [slots, weekStart]);

  const handleDraftCreate = useCallback(
    (dayIndex: number, block: { startMin: number; endMin: number }) => {
      setWeekDrafts((prev) => {
        const next = new Map(prev);
        const existing = next.get(dayIndex) ?? [];
        next.set(dayIndex, [...existing, block]);
        return next;
      });
    },
    []
  );

  const removeDraft = useCallback((dayIndex: number, draftIdx: number) => {
    setWeekDrafts((prev) => {
      const next = new Map(prev);
      const existing = [...(next.get(dayIndex) ?? [])];
      existing.splice(draftIdx, 1);
      next.set(dayIndex, existing);
      return next;
    });
  }, []);

  const totalDrafts = useMemo(() => {
    let count = 0;
    for (const arr of weekDrafts.values()) {
      count += arr.length;
    }
    return count;
  }, [weekDrafts]);

  const handleConfirmAll = () => {
    const allSlots: { startDateTime: string; endDateTime: string }[] = [];

    for (const [dayIndex, draftBlocks] of weekDrafts.entries()) {
      if (draftBlocks.length === 0) continue;

      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + dayIndex);
      const dateStr = toLocalDateStr(dayDate);

      for (const d of draftBlocks) {
        const { start, end } = minutesToTime(d.startMin, d.endMin);
        allSlots.push({
          startDateTime: `${dateStr}T${start}:00`,
          endDateTime: `${dateStr}T${end}:00`,
        });
      }
    }

    if (allSlots.length === 0) {
      toast.info("Brak nowych slotów do zapisania");
      return;
    }

    createMutation.mutate(allSlots);
  };

  const handleClearDrafts = () => {
    setWeekDrafts(new Map());
  };

  useEffect(() => {
    setWeekDrafts(new Map());
  }, [weekStart]);

  if (!dbUser || dbUser.role !== "EMPLOYEE") {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-brand-dark-muted">
        <p>Przekierowuję...</p>
      </div>
    );
  }

  const monday = weekStart;
  const weekLabel = `${monday.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })} – ${new Date(
    monday.getTime() + 6 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return {
      index: i,
      date: d,
      name: DAY_NAMES[i],
      short: DAY_SHORT[i],
      dateLabel: d.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "numeric",
      }),
      blocks: blocksByDay.get(i) ?? [],
      drafts: weekDrafts.get(i) ?? [],
    };
  });

  const totalSaved = slots.length;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-muted flex items-center justify-center">
            <CalendarCheck className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Moja dostępność</h1>
            <p className="text-xs text-brand-dark-muted">Zgłoś kiedy możesz pracować</p>
          </div>
        </div>
        {totalDrafts > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              {totalDrafts} nowy{totalDrafts === 1 ? "" : totalDrafts < 5 ? "e" : "ch"} slot{totalDrafts === 1 ? "" : totalDrafts < 5 ? "y" : "ów"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-brand-dark-muted hover:text-brand-dark"
              onClick={handleClearDrafts}
            >
              Wyczyść
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-brand hover:bg-brand-light text-white"
              onClick={handleConfirmAll}
              disabled={createMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              {createMutation.isPending ? "Zapisywanie..." : "Zatwierdź wszystko"}
            </Button>
          </div>
        )}
      </div>

      {/* Instruction hint */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-blue-muted/30 border border-brand-blue/10 text-sm">
        <Info className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
        <div className="text-brand-dark-muted text-xs leading-relaxed">
          <strong className="text-brand-dark">Jak dodać dostępność?</strong>{" "}
          Kliknij i przeciągnij na pasku danego dnia, aby zaznaczyć przedział czasowy (min. 4 godziny).
          Możesz dodać wiele bloków na cały tydzień. Gdy skończysz, kliknij <strong className="text-brand">&quot;Zatwierdź wszystko&quot;</strong>.
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="border-brand-warm hover:bg-brand-warm-light"
          onClick={() =>
            setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))
          }
          aria-label="Poprzedni tydzień"
        >
          <ChevronLeft className="h-4 w-4 text-brand-dark-muted" />
        </Button>
        <span className="font-semibold text-brand-dark text-sm min-w-[220px] text-center">
          {weekLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="border-brand-warm hover:bg-brand-warm-light"
          onClick={() =>
            setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))
          }
          aria-label="Następny tydzień"
        >
          <ChevronRight className="h-4 w-4 text-brand-dark-muted" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-brand hover:text-brand-light hover:bg-brand-muted ml-1"
          onClick={() => setWeekStart(getWeekMonday(new Date()))}
        >
          Dziś
        </Button>
        {totalSaved > 0 && (
          <span className="text-[11px] text-brand-dark-soft ml-2">
            {totalSaved} zapisany{totalSaved > 1 ? "ch" : ""} slot{totalSaved > 1 ? "ów" : ""}
          </span>
        )}
      </div>

      {/* Availability table */}
      <div className="bg-white border border-brand-warm rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-brand-dark-muted text-sm">
              <div className="w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
              Ładowanie dostępności...
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-warm-light/30">
                <th className="text-left p-2.5 border-b border-r border-brand-warm font-semibold text-brand-dark-muted w-[120px] min-w-[120px] text-[11px] uppercase tracking-wider">
                  Dzień
                </th>
                <th className="border-b border-brand-warm p-0">
                  <div className="relative h-5">
                    {Array.from({ length: 25 }, (_, h) => h)
                      .filter((h) => h % 3 === 0)
                      .map((h) => (
                        <span
                          key={h}
                          className="absolute text-[9px] text-brand-dark-soft select-none font-medium"
                          style={{
                            left: `${(h / 24) * 100}%`,
                            transform:
                              h === 0
                                ? "none"
                                : h === 24
                                ? "translateX(-100%)"
                                : "translateX(-50%)",
                            bottom: "1px",
                          }}
                        >
                          {h}:00
                        </span>
                      ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const isWeekend = day.index >= 5;
                const isToday =
                  toLocalDateStr(day.date) === toLocalDateStr(new Date());

                return (
                  <tr
                    key={day.index}
                    className={`border-b border-brand-warm last:border-b-0 ${
                      isWeekend ? "bg-brand-warm-light/20" : ""
                    }`}
                  >
                    <td
                      className={`p-2.5 border-r border-brand-warm ${
                        isToday
                          ? "bg-brand-muted/40"
                          : ""
                      }`}
                    >
                      <div className={`text-sm font-medium ${isToday ? "text-brand" : "text-brand-dark"}`}>
                        {day.short}
                      </div>
                      <div className="text-[11px] text-brand-dark-soft">
                        {day.dateLabel}
                      </div>
                    </td>

                    <td className="p-0 relative">
                      <TimeBlockStrip
                        blocks={day.blocks}
                        drafts={day.drafts}
                        minBlockMinutes={MIN_BLOCK_MINUTES}
                        onDraftCreate={(block) =>
                          handleDraftCreate(day.index, block)
                        }
                        onDeleteBlock={deleteMutation.mutate}
                        disabled={createMutation.isPending}
                        height={48}
                        showHourLabels={false}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Draft summary */}
      {totalDrafts > 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-4">
          <h3 className="font-semibold text-emerald-800 text-sm mb-2">
            Nowe sloty do zatwierdzenia:
          </h3>
          <div className="space-y-1.5">
            {days.map((day) => {
              if (day.drafts.length === 0) return null;
              return (
                <div key={day.index} className="flex items-center gap-2">
                  <span className="text-sm text-emerald-700 font-medium w-[100px]">
                    {day.short} {day.dateLabel}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {day.drafts.map((d, idx) => {
                      const { start, end } = minutesToTime(d.startMin, d.endMin);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {start}–{end}
                          <button
                            type="button"
                            className="text-emerald-500 hover:text-red-500 font-bold transition-colors"
                            onClick={() => removeDraft(day.index, idx)}
                            title="Usuń slot"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDrafts}
              className="text-brand-dark-muted hover:text-brand-dark"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Wyczyść
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAll}
              disabled={createMutation.isPending}
              className="gap-1.5 bg-brand hover:bg-brand-light text-white"
            >
              <Check className="h-3.5 w-3.5" />
              {createMutation.isPending
                ? "Zapisywanie..."
                : `Zatwierdź (${totalDrafts})`}
            </Button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-brand-dark-soft">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-brand-blue/70" />
          Zapisana dostępność
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500/70 border border-dashed border-emerald-600/50" />
          Nowy slot (niezapisany)
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Minimum 4 godziny
        </span>
      </div>
    </div>
  );
}
