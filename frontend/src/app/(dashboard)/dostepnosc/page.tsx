"use client";

import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  getMyAvailability,
  createAvailabilitySlots,
  deleteAvailabilitySlot,
  type AvailabilitySlot,
} from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { TimeBlockStrip, type TimeBlock } from "@/components/dashboard/TimeBlockStrip";
import { minutesToTime } from "@/components/dashboard/TimeBlockStrip";

const MIN_BLOCK_MINUTES = 4 * 60; // 4 godziny
const DAY_NAMES = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function toISODate(d: Date): string {
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
  const start = new Date(s.startDateTime);
  const end = new Date(s.endDateTime);
  return {
    startMin: start.getHours() * 60 + start.getMinutes(),
    endMin: end.getHours() * 60 + end.getMinutes(),
  };
}

export default function DostepnoscPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()));
  const [draftDay, setDraftDay] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ startMin: number; endMin: number } | null>(null);

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
      toast.success("Dostępność dodana");
      setDraft(null);
      setDraftDay(null);
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
      const slotDateStr = slot.startDateTime.slice(0, 10);
      let dayIndex = -1;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        if (toISODate(d) === slotDateStr) {
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

  const handleConfirmDraft = (dayIndex: number) => {
    if (!draft || draftDay !== dayIndex) return;
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const { start, end } = minutesToTime(draft.startMin, draft.endMin);
    const startDateTime = `${toISODate(dayDate)}T${start}:00`;
    const endDateTime = `${toISODate(dayDate)}T${end}:00`;
    createMutation.mutate([{ startDateTime, endDateTime }]);
  };

  if (!dbUser || dbUser.role !== "EMPLOYEE") {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-500">
        <p>Przekierowuję...</p>
      </div>
    );
  }

  const monday = weekStart;
  const weekLabel = `${monday.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} – ${new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800">Moja dostępność</h1>
      <p className="text-slate-600 text-sm">
        Kliknij na pasmo dnia, aby dodać przedział (min. 4 h). Przeciągnij blok, aby przesunąć; za brzegi — aby zmienić długość. Potwierdź przyciskiem „Dodaj”.
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
          aria-label="Poprzedni tydzień"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-slate-700 min-w-[220px] text-center">{weekLabel}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
          aria-label="Następny tydzień"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        {isLoading ? (
          <p className="text-slate-500 text-sm">Ładowanie...</p>
        ) : (
          Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(d.getDate() + i);
            const label = `${DAY_NAMES[i]} ${d.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" })}`;
            const blocks = blocksByDay.get(i) ?? [];
            const isDraftHere = draftDay === i;
            return (
              <TimeBlockStrip
                key={i}
                label={label}
                blocks={blocks}
                minBlockMinutes={MIN_BLOCK_MINUTES}
                draft={isDraftHere ? draft : null}
                onDraftChange={(v) => {
                  setDraft(v);
                  setDraftDay(i);
                }}
                onConfirmDraft={() => handleConfirmDraft(i)}
                onDeleteBlock={deleteMutation.mutate}
                disabled={createMutation.isPending}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
