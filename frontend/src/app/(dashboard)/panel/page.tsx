"use client";

import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getTeamAvailability, type AvailabilitySlot } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, User, Plus } from "lucide-react";
import { CreateShiftDialog } from "@/components/dashboard/CreateShiftDialog";

const DAY_NAMES = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function buildWeekRange(monday: Date): { from: string; to: string } {
  const from = new Date(monday);
  const to = new Date(monday);
  to.setDate(to.getDate() + 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type ViewMode = "day" | "person";

export default function PanelPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);

  useEffect(() => {
    if (dbUser && dbUser.role !== "OWNER" && dbUser.role !== "MANAGER") {
      router.replace("/");
    }
  }, [dbUser, router]);

  const { from, to } = useMemo(() => buildWeekRange(weekStart), [weekStart]);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["availability-team", from, to],
    queryFn: () => getTeamAvailability({ from, to }),
    enabled: !!dbUser && (dbUser.role === "OWNER" || dbUser.role === "MANAGER"),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    const monday = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      map.set(toDateKey(d), []);
    }
    for (const slot of slots) {
      const start = new Date(slot.startDateTime);
      const key = toDateKey(start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    }
    return map;
  }, [slots, weekStart]);

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; slots: AvailabilitySlot[] }>();
    for (const slot of slots) {
      const uid = slot.userId;
      const name = slot.user
        ? (slot.user.nickname || slot.user.name)
        : "Nieznany";
      if (!map.has(uid)) map.set(uid, { name, slots: [] });
      map.get(uid)!.slots.push(slot);
    }
    for (const entry of map.values()) {
      entry.slots.sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
    }
    return map;
  }, [slots]);

  if (!dbUser) return null;
  if (dbUser.role !== "OWNER" && dbUser.role !== "MANAGER") {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Panel Menedżera</h1>
        <Button onClick={() => setIsCreateShiftOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj zmianę
        </Button>
      </div>

      <p className="text-slate-600 text-sm">
        Dostępności pracowników w wybranym tygodniu. Na tej podstawie przypisuj ich do zmian w zakładce Grafik.
      </p>

      <div className="flex items-center gap-2 flex-wrap">
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

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={viewMode === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("day")}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Po dniu
        </Button>
        <Button
          variant={viewMode === "person" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("person")}
        >
          <User className="h-4 w-4 mr-1" />
          Po osobie
        </Button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Ładowanie dostępności...</p>
      ) : viewMode === "day" ? (
        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(d.getDate() + i);
            const key = toDateKey(d);
            const daySlots = byDay.get(key) ?? [];
            const dayName = DAY_NAMES[i];
            const dateStr = d.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" });
            return (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-slate-800 mb-2">
                  {dayName} {dateStr}
                </h3>
                {daySlots.length === 0 ? (
                  <p className="text-slate-500 text-sm">Brak dostępności</p>
                ) : (
                  <ul className="space-y-1.5">
                    {daySlots.map((slot) => {
                      const start = new Date(slot.startDateTime);
                      const end = new Date(slot.endDateTime);
                      const who = slot.user
                        ? (slot.user.nickname || slot.user.name)
                        : "—";
                      const timeStr = `${start.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
                      return (
                        <li
                          key={slot.id}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-slate-50 border border-slate-100"
                        >
                          <span className="font-medium text-slate-800">{who}</span>
                          <span className="text-slate-600">{timeStr}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {byPerson.size === 0 ? (
            <p className="text-slate-500 text-sm">Brak dostępności w tym tygodniu.</p>
          ) : (
            Array.from(byPerson.entries()).map(([userId, { name, slots: userSlots }]) => (
              <div
                key={userId}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-slate-800 mb-2">{name}</h3>
                <ul className="space-y-1.5">
                  {userSlots.map((slot) => {
                    const start = new Date(slot.startDateTime);
                    const end = new Date(slot.endDateTime);
                    const dayStr = start.toLocaleDateString("pl-PL", {
                      weekday: "short",
                      day: "numeric",
                      month: "numeric",
                    });
                    const timeStr = `${start.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
                    return (
                      <li
                        key={slot.id}
                        className="text-sm py-1.5 px-2 rounded bg-slate-50 border border-slate-100"
                      >
                        {dayStr} — {timeStr}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      <CreateShiftDialog
        isOpen={isCreateShiftOpen}
        onClose={() => setIsCreateShiftOpen(false)}
      />
    </div>
  );
}
