"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  claimAssignment,
  getMarketplace,
  publishShifts,
  getShifts,
  getTeamAvailability,
  createShift,
  addAssignment,
  type Shift,
  type ShiftAssignment,
  type AvailabilitySlot,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { ScheduleGrid, type AvailabilityDropData } from "@/components/dashboard/ScheduleGrid";
import { CreateShiftDialog } from "@/components/dashboard/CreateShiftDialog";
import { CopyWeekDialog } from "@/components/dashboard/CopyWeekDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Send,
  AlertTriangle,
  Clock,
  Users,
  GripVertical,
  ShoppingBag,
  Plus,
  Info,
  CalendarDays,
  Copy,
} from "lucide-react";

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Marketplace Section ──────────────────────────────────
function GieldaSection({
  currentUserId,
  currentUserRole,
  claimMutation,
}: {
  currentUserId: string;
  currentUserRole: string;
  claimMutation: { mutate: (id: string) => void; isPending: boolean };
}) {
  const { data: marketplace = [] } = useQuery({
    queryKey: ["marketplace"],
    queryFn: getMarketplace,
  });

  if (marketplace.length === 0) return null;

  return (
    <div className="bg-white border border-brand-warm/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
          <ShoppingBag className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h3 className="font-semibold text-brand-dark">
            Giełda zmian
          </h3>
          <p className="text-[11px] text-brand-dark/40">{marketplace.length} {marketplace.length === 1 ? "zmiana dostępna" : "zmian dostępnych"}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {marketplace.map((a: ShiftAssignment) => {
          const shift = a.shift;
          if (!shift) return null;
          const who = a.user ? a.user.nickname || a.user.name : "Ktoś";
          const date = new Date(shift.startTime).toLocaleDateString("pl-PL", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          const startMatch = shift.startTime.match(/T(\d{2}:\d{2})/);
          const endMatch = shift.endTime.match(/T(\d{2}:\d{2})/);
          const timeStr = `${startMatch?.[1] ?? "??"}–${endMatch?.[1] ?? "??"}`;
          const isMine = a.userId === currentUserId;
          const dur = Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000 * 10) / 10;
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-3 px-4 rounded-lg border border-brand-warm/30 bg-brand-warm-light/30 text-sm hover:bg-brand-warm-light/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-dark">{shift.roleName}</span>
                  <span className="text-brand-dark/20">·</span>
                  <span className="text-brand-dark/60">{date}</span>
                </div>
                <div className="flex items-center gap-2 text-brand-dark/40 text-xs mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeStr}
                  </span>
                  <span className="text-[10px] font-medium text-brand-dark/25 bg-brand-dark/5 px-1 rounded">
                    {dur}h
                  </span>
                  {who && <span className="text-brand-dark/30">oddaje: {who}</span>}
                </div>
              </div>
              {!isMine && currentUserRole === "EMPLOYEE" && (
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand-light text-white text-xs"
                  onClick={() => claimMutation.mutate(a.id)}
                  disabled={claimMutation.isPending}
                >
                  Przejmij
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Employee Availability Panel (with Drag & Drop) ──────
function AvailabilityPanel({
  weekStart,
}: {
  weekStart: Date;
}) {
  const monday = getWeekMonday(weekStart);
  const toDate = new Date(monday);
  toDate.setDate(toDate.getDate() + 7);
  const from = monday.toISOString();
  const to = toDate.toISOString();

  const { data: teamAvailability = [], isLoading } = useQuery({
    queryKey: ["availability-team", from, to],
    queryFn: () => getTeamAvailability({ from, to }),
  });

  const DAY_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [monday]);

  const byUser = useMemo(() => {
    const map = new Map<string, { name: string; userId: string; slots: { dayIdx: number; dateKey: string; start: string; end: string }[] }>();

    for (const slot of teamAvailability) {
      const userId = slot.userId;
      const userName = slot.user?.nickname || slot.user?.name || "?";

      if (!map.has(userId)) {
        map.set(userId, { name: userName, userId, slots: [] });
      }

      const dateStr = slot.startDateTime.slice(0, 10);
      let dayIdx = -1;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        if (toLocalDateKey(d) === dateStr) {
          dayIdx = i;
          break;
        }
      }

      if (dayIdx >= 0) {
        const startMatch = slot.startDateTime.match(/T(\d{2}:\d{2})/);
        const endMatch = slot.endDateTime.match(/T(\d{2}:\d{2})/);
        map.get(userId)!.slots.push({
          dayIdx,
          dateKey: dateStr,
          start: startMatch?.[1] ?? "??",
          end: endMatch?.[1] ?? "??",
        });
      }
    }

    return map;
  }, [teamAvailability, monday]);

  const handleDragStart = (
    e: React.DragEvent,
    userId: string,
    employeeName: string,
    dateKey: string,
    start: string,
    end: string
  ) => {
    e.dataTransfer.setData(
      "application/availability",
      JSON.stringify({ userId, employeeName, dateKey, start, end })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-brand-warm/40 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-brand-dark/40 text-sm">
          <div className="w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
          Ładowanie dostępności...
        </div>
      </div>
    );
  }

  if (byUser.size === 0) {
    return (
      <div className="bg-white border border-brand-warm/40 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-blue-muted flex items-center justify-center">
            <Users className="h-4 w-4 text-brand-blue" />
          </div>
          <h3 className="font-semibold text-brand-dark">Dostępność pracowników</h3>
        </div>
        <p className="text-brand-dark/40 text-sm">Brak zgłoszonej dostępności na ten tydzień.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-warm/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-blue-muted flex items-center justify-center">
            <Users className="h-4 w-4 text-brand-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark">Dostępność pracowników</h3>
            <p className="text-[11px] text-brand-dark/30">{byUser.size} {byUser.size === 1 ? "pracownik" : "pracowników"} zgłosiło dostępność</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-brand-dark/30 bg-brand-blue-muted/50 px-2.5 py-1 rounded-full">
          <GripVertical className="h-3 w-3" />
          Przeciągnij na kalendarz
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-brand-warm-light/30">
              <th className="text-left p-2 border-b border-brand-warm/30 font-semibold text-brand-dark/50 min-w-[120px] text-[11px] uppercase tracking-wider">
                Pracownik
              </th>
              {DAY_SHORT.map((d, i) => (
                <th key={i} className="p-2 border-b border-l border-brand-warm/20 font-medium text-brand-dark/40 text-center min-w-[80px] text-[11px]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(byUser.entries()).map(([mapUserId, data]) => (
              <tr key={mapUserId} className="border-b border-brand-warm/10 hover:bg-brand-warm-light/20 transition-colors">
                <td className="p-2 text-brand-dark font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-blue-muted flex items-center justify-center text-[10px] font-bold text-brand-blue flex-shrink-0">
                      {data.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[80px]">{data.name}</span>
                  </div>
                </td>
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const daySlots = data.slots.filter((s) => s.dayIdx === dayIdx);
                  return (
                    <td key={dayIdx} className="p-1 border-l border-brand-warm/10 text-center align-middle">
                      {daySlots.length > 0 ? (
                        <div className="space-y-0.5">
                          {daySlots.map((s, si) => (
                            <div
                              key={si}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, data.userId, data.name, s.dateKey, s.start, s.end)
                              }
                              className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-md px-1.5 py-1 text-[10px] font-medium cursor-grab active:cursor-grabbing hover:bg-emerald-100 hover:shadow-sm transition-all flex items-center gap-0.5 select-none justify-center"
                              title={`${data.name}: ${s.start}–${s.end} — przeciągnij na kalendarz`}
                            >
                              <GripVertical className="h-2.5 w-2.5 text-emerald-400 flex-shrink-0 opacity-50" />
                              <span>{s.start}–{s.end}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-brand-dark/10">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function GrafikPage() {
  const { dbUser } = useDashboardUser();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => new Date());
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>();
  const [prefilledEmployeeId, setPrefilledEmployeeId] = useState<string | undefined>();
  const [editShift, setEditShift] = useState<Shift | null>(null);

  const monday = getWeekMonday(weekStart);
  const from = monday.toISOString();
  const toDate = new Date(monday);
  toDate.setDate(toDate.getDate() + 7);
  const toStr = toDate.toISOString();

  const claimMutation = useMutation({
    mutationFn: claimAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Pozycja przejęta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: weekShifts = [] } = useQuery({
    queryKey: ["shifts", from, toStr],
    queryFn: () => getShifts({ from, to: toStr }),
  });
  const draftCount = weekShifts.filter((s) => s.status === "DRAFT").length;

  const publishMutation = useMutation({
    mutationFn: () => publishShifts({ from, to: toStr }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      const msg = `Opublikowano ${result.published} zmian${result.published === 1 ? "ę" : ""}`;
      if (result.warnings.length > 0) {
        toast.warning(msg, { description: result.warnings.slice(0, 3).join("\n"), duration: 8000 });
      } else {
        toast.success(msg);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";

  const handleCellClick = (employeeId: string, dateKey: string) => {
    setEditShift(null);
    setPrefilledDate(dateKey);
    setPrefilledEmployeeId(employeeId);
    setIsShiftDialogOpen(true);
  };

  const handleShiftClick = (shift: Shift) => {
    setEditShift(shift);
    setPrefilledDate(undefined);
    setPrefilledEmployeeId(undefined);
    setIsShiftDialogOpen(true);
  };

  const handleAddShiftButton = () => {
    setEditShift(null);
    setPrefilledDate(undefined);
    setPrefilledEmployeeId(undefined);
    setIsShiftDialogOpen(true);
  };

  const dropShiftMutation = useMutation({
    mutationFn: async (data: AvailabilityDropData) => {
      const startISO = `${data.dateKey}T${data.startTime}:00`;
      const endISO = `${data.dateKey}T${data.endTime}:00`;
      const shift = await createShift({
        startTime: startISO,
        endTime: endISO,
        roleName: "Zmiana",
        status: "DRAFT",
      });
      await addAssignment(shift.id, {
        userId: data.employeeId,
        isUpForGrabs: false,
      });
      return shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Utworzono zmianę (szkic) z dostępności");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDropAvailability = useCallback(
    (data: AvailabilityDropData) => {
      dropShiftMutation.mutate(data);
    },
    [dropShiftMutation]
  );

  const handleCloseDialog = () => {
    setIsShiftDialogOpen(false);
    setEditShift(null);
    setPrefilledDate(undefined);
    setPrefilledEmployeeId(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Grafik</h1>
            <p className="text-xs text-brand-dark/40">Zarządzaj zmianami pracowników</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && draftCount > 0 && (
            <Button
              variant="outline"
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 text-sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {publishMutation.isPending ? "Publikowanie..." : `Publikuj (${draftCount})`}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsCopyDialogOpen(true)}
              className="gap-1.5 border-brand-warm/60 text-brand-dark/70 hover:bg-brand-warm-light text-sm"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Kopiuj tydzień</span>
            </Button>
          )}
          {isAdmin && (
            <Button onClick={handleAddShiftButton} className="gap-1.5 bg-brand hover:bg-brand-light text-white text-sm">
              <Plus className="h-4 w-4" />
              Dodaj zmianę
            </Button>
          )}
        </div>
      </div>

      {/* Publish warning banner */}
      {isAdmin && draftCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              {draftCount} zmian{draftCount === 1 ? "a" : draftCount < 5 ? "y" : ""} w szkicu
            </p>
            <p className="text-amber-600/80 text-xs mt-0.5">
              Pracownicy nie widzą zmian w statusie &quot;szkic&quot;. Kliknij &quot;Publikuj&quot;, aby udostępnić grafik.
            </p>
          </div>
        </div>
      )}

      <ScheduleGrid
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        currentUserId={dbUser?.id ?? ""}
        currentUserRole={dbUser?.role ?? "EMPLOYEE"}
        onCellClick={isAdmin ? handleCellClick : undefined}
        onShiftClick={isAdmin ? handleShiftClick : undefined}
        onDropAvailability={isAdmin ? handleDropAvailability : undefined}
      />

      {/* Availability panel - managers only */}
      {isAdmin && <AvailabilityPanel weekStart={weekStart} />}

      <GieldaSection
        currentUserId={dbUser?.id ?? ""}
        currentUserRole={dbUser?.role ?? "EMPLOYEE"}
        claimMutation={claimMutation}
      />

      <CreateShiftDialog
        isOpen={isShiftDialogOpen}
        onClose={handleCloseDialog}
        prefilledDate={prefilledDate}
        prefilledEmployeeId={prefilledEmployeeId}
        editShift={editShift}
      />

      <CopyWeekDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        currentWeekStart={weekStart}
      />
    </div>
  );
}
