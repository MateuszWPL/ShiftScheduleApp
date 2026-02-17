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
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  TimeBlockStrip,
  type TimeBlock,
  minutesToTime,
} from "@/components/dashboard/TimeBlockStrip";

const MIN_BLOCK_MINUTES = 4 * 60; // 4 godziny
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

/**
 * Parse slot datetime to minutes WITHOUT timezone conversion.
 * The backend stores times that represent "wall clock" times,
 * so we extract hours/minutes from the ISO string directly.
 */
function slotToMinutes(s: AvailabilitySlot): { startMin: number; endMin: number } {
  // Parse directly from ISO string to avoid timezone shift
  // ISO format: "2026-02-17T08:00:00.000Z" → we want 08:00 not local time
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
  // Drafts: one array per day index (0-6), each can have multiple blocks
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

  // Organize saved blocks by day
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

  // Add a draft block for a day
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

  // Remove a draft block
  const removeDraft = useCallback((dayIndex: number, draftIdx: number) => {
    setWeekDrafts((prev) => {
      const next = new Map(prev);
      const existing = [...(next.get(dayIndex) ?? [])];
      existing.splice(draftIdx, 1);
      next.set(dayIndex, existing);
      return next;
    });
  }, []);

  // Count total drafts
  const totalDrafts = useMemo(() => {
    let count = 0;
    for (const arr of weekDrafts.values()) {
      count += arr.length;
    }
    return count;
  }, [weekDrafts]);

  // Confirm all drafts at once
  const handleConfirmAll = () => {
    const allSlots: { startDateTime: string; endDateTime: string }[] = [];

    for (const [dayIndex, draftBlocks] of weekDrafts.entries()) {
      if (draftBlocks.length === 0) continue;

      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + dayIndex);
      const dateStr = toLocalDateStr(dayDate);

      for (const d of draftBlocks) {
        const { start, end } = minutesToTime(d.startMin, d.endMin);
        // Send without timezone suffix so backend stores as-is
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

  // Clear all drafts
  const handleClearDrafts = () => {
    setWeekDrafts(new Map());
  };

  // Reset drafts when week changes
  useEffect(() => {
    setWeekDrafts(new Map());
  }, [weekStart]);

  if (!dbUser || dbUser.role !== "EMPLOYEE") {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-500">
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

  // Generate day data for the table
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

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">
          Moja dostępność
        </h1>
        {totalDrafts > 0 && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-300 text-emerald-700 bg-emerald-50"
            >
              {totalDrafts} nowy{totalDrafts === 1 ? "" : totalDrafts < 5 ? "e" : "ch"} slot
              {totalDrafts === 1 ? "" : totalDrafts < 5 ? "y" : "ów"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500"
              onClick={handleClearDrafts}
            >
              Wyczyść
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleConfirmAll}
              disabled={createMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              {createMutation.isPending
                ? "Zapisywanie..."
                : "Zatwierdź wszystko"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-sm">
        Kliknij i przeciągnij na pasku, aby zaznaczyć dostępność (min. 4h).
        Dodaj bloki na cały tydzień, a następnie kliknij „Zatwierdź
        wszystko".
      </p>

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setWeekStart(
              new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
            )
          }
          aria-label="Poprzedni tydzień"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-slate-700 min-w-[220px] text-center">
          {weekLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setWeekStart(
              new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            )
          }
          aria-label="Następny tydzień"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 ml-1"
          onClick={() => setWeekStart(getWeekMonday(new Date()))}
        >
          Dziś
        </Button>
      </div>

      {/* Availability table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">
            Ładowanie dostępności...
          </div>
        ) : (
          <table className="w-full border-collapse">
            {/* Header with hour markers */}
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-2 border-b border-r border-slate-200 font-semibold text-slate-700 w-[120px] min-w-[120px]">
                  Dzień
                </th>
                <th className="border-b border-slate-200 p-0">
                  <div className="relative h-5">
                    {Array.from({ length: 25 }, (_, h) => h)
                      .filter((h) => h % 3 === 0)
                      .map((h) => (
                        <span
                          key={h}
                          className="absolute text-[9px] text-slate-400 select-none"
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
                    className={`border-b border-slate-100 last:border-b-0 ${
                      isWeekend ? "bg-slate-50/50" : ""
                    }`}
                  >
                    {/* Day label */}
                    <td
                      className={`p-2 border-r border-slate-200 ${
                        isToday
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-slate-700"
                      }`}
                    >
                      <div className="text-sm font-medium">{day.short}</div>
                      <div className="text-xs text-slate-500">
                        {day.dateLabel}
                      </div>
                    </td>

                    {/* Time strip cell */}
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-800 text-sm mb-2">
            Nowe sloty do zatwierdzenia:
          </h3>
          <div className="space-y-1">
            {days.map((day) => {
              if (day.drafts.length === 0) return null;
              return (
                <div key={day.index} className="flex items-center gap-2">
                  <span className="text-sm text-emerald-700 font-medium w-[100px]">
                    {day.short} {day.dateLabel}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {day.drafts.map((d, idx) => {
                      const { start, end } = minutesToTime(
                        d.startMin,
                        d.endMin
                      );
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full"
                        >
                          {start}–{end}
                          <button
                            type="button"
                            className="text-emerald-600 hover:text-red-600 font-bold"
                            onClick={() => removeDraft(day.index, idx)}
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
              className="text-slate-600"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Wyczyść
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAll}
              disabled={createMutation.isPending}
              className="gap-1.5"
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
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-blue-500/80" />
          Zapisana dostępność
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500/80 border border-dashed border-emerald-600/60" />
          Nowy slot (niezapisany)
        </span>
      </div>
    </div>
  );
}
