"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  claimAssignment,
  getMarketplace,
  publishShifts,
  getShifts,
  getSwapRequests,
  getTeamAvailability,
  approveSwapRequest,
  rejectSwapRequest,
  type Shift,
  type ShiftAssignment,
  type SwapRequest,
  type AvailabilitySlot,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { ScheduleGrid } from "@/components/dashboard/ScheduleGrid";
import { CreateShiftDialog } from "@/components/dashboard/CreateShiftDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  AlertTriangle,
  ArrowRightLeft,
  Check,
  X,
  Clock,
  Users,
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
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-orange-400" />
        <h3 className="font-semibold text-slate-800">
          Giełda zmian ({marketplace.length})
        </h3>
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
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{shift.roleName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">{date}</span>
                </div>
                <div className="text-slate-500 text-xs mt-0.5">
                  {timeStr}
                  {who && <span className="text-slate-400"> — oddaje: {who}</span>}
                </div>
              </div>
              {!isMine && currentUserRole === "EMPLOYEE" && (
                <Button
                  size="sm"
                  onClick={() => claimMutation.mutate(a.id)}
                  disabled={claimMutation.isPending}
                >
                  Biorę
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Swap Requests Section ──────────────────────────────────
function SwapRequestsSection({
  currentUserId,
  currentUserRole,
}: {
  currentUserId: string;
  currentUserRole: string;
}) {
  const queryClient = useQueryClient();
  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const { data: swapRequests = [] } = useQuery({
    queryKey: ["swap-requests"],
    queryFn: getSwapRequests,
  });

  const approveMut = useMutation({
    mutationFn: approveSwapRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swap-requests"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Zamiana zatwierdzona");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: rejectSwapRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swap-requests"] });
      toast.success("Prośba odrzucona");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (swapRequests.length === 0) return null;

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING_ACCEPT: { label: "Czeka na akceptację", color: "border-yellow-300 text-yellow-700 bg-yellow-50" },
    ACCEPTED: { label: "Zaakceptowana", color: "border-blue-300 text-blue-700 bg-blue-50" },
    PENDING_APPROVAL: { label: "Czeka na zatwierdzenie", color: "border-purple-300 text-purple-700 bg-purple-50" },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft className="h-4 w-4 text-blue-500" />
        <h3 className="font-semibold text-slate-800">Zamiany zmian ({swapRequests.length})</h3>
      </div>
      <ul className="space-y-2">
        {swapRequests.map((swap: SwapRequest) => {
          const shift = swap.assignment?.shift;
          if (!shift) return null;
          const requesterName = swap.requester?.nickname || swap.requester?.name || "?";
          const targetName = swap.targetUser?.nickname || swap.targetUser?.name;
          const statusInfo = statusLabels[swap.status] || statusLabels.PENDING_ACCEPT;

          return (
            <li key={swap.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{requesterName}</span>
                  <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-600">{targetName || "Ktokolwiek"}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="text-slate-500 text-xs mt-0.5">
                  {shift.roleName}
                  {swap.reason && <span className="text-slate-400 ml-1">— "{swap.reason}"</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && swap.status === "PENDING_APPROVAL" && (
                  <>
                    <Button size="sm" className="h-7 text-xs gap-1" disabled={approveMut.isPending} onClick={() => approveMut.mutate(swap.id)}>
                      <Check className="h-3 w-3" />Zatwierdź
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={rejectMut.isPending} onClick={() => rejectMut.mutate(swap.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {swap.requesterId === currentUserId && (swap.status === "PENDING_ACCEPT" || swap.status === "ACCEPTED") && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" disabled={rejectMut.isPending} onClick={() => rejectMut.mutate(swap.id)}>
                    Anuluj
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Employee Availability Panel ──────────────────────────
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

  // Group by user
  const byUser = useMemo(() => {
    const map = new Map<string, { name: string; slots: { dayIdx: number; start: string; end: string }[] }>();

    for (const slot of teamAvailability) {
      const userId = slot.userId;
      const userName = slot.user?.nickname || slot.user?.name || "?";

      if (!map.has(userId)) {
        map.set(userId, { name: userName, slots: [] });
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
          start: startMatch?.[1] ?? "??",
          end: endMatch?.[1] ?? "??",
        });
      }
    }

    return map;
  }, [teamAvailability, monday]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="animate-pulse text-slate-500 text-sm">Ładowanie dostępności...</div>
      </div>
    );
  }

  if (byUser.size === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-slate-800">Dostępność pracowników</h3>
        </div>
        <p className="text-slate-500 text-sm">Brak zgłoszonej dostępności na ten tydzień.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-blue-500" />
        <h3 className="font-semibold text-slate-800">Dostępność pracowników</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left p-1.5 border-b border-slate-200 font-medium text-slate-600 min-w-[100px]">
                Pracownik
              </th>
              {DAY_SHORT.map((d, i) => (
                <th key={i} className="p-1.5 border-b border-l border-slate-200 font-medium text-slate-600 text-center min-w-[70px]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(byUser.entries()).map(([userId, data]) => (
              <tr key={userId} className="border-b border-slate-100">
                <td className="p-1.5 text-slate-700 font-medium">{data.name}</td>
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const daySlots = data.slots.filter((s) => s.dayIdx === dayIdx);
                  return (
                    <td key={dayIdx} className="p-1 border-l border-slate-100 text-center">
                      {daySlots.length > 0 ? (
                        <div className="space-y-0.5">
                          {daySlots.map((s, si) => (
                            <div
                              key={si}
                              className="bg-blue-100 text-blue-700 rounded px-1 py-0.5 text-[10px] font-medium"
                            >
                              <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                              {s.start}–{s.end}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
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

  // Open dialog for creating shift (from cell click)
  const handleCellClick = (employeeId: string, dateKey: string) => {
    setEditShift(null);
    setPrefilledDate(dateKey);
    setPrefilledEmployeeId(employeeId);
    setIsShiftDialogOpen(true);
  };

  // Open dialog for editing shift
  const handleShiftClick = (shift: Shift) => {
    setEditShift(shift);
    setPrefilledDate(undefined);
    setPrefilledEmployeeId(undefined);
    setIsShiftDialogOpen(true);
  };

  // Open dialog for creating shift (from button)
  const handleAddShiftButton = () => {
    setEditShift(null);
    setPrefilledDate(undefined);
    setPrefilledEmployeeId(undefined);
    setIsShiftDialogOpen(true);
  };

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
        <h1 className="text-2xl font-bold text-slate-800">Grafik</h1>
        <div className="flex items-center gap-2">
          {isAdmin && draftCount > 0 && (
            <Button
              variant="outline"
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {publishMutation.isPending ? "Publikowanie..." : `Publikuj tydzień (${draftCount})`}
            </Button>
          )}
          {isAdmin && (
            <Button onClick={handleAddShiftButton}>+ Dodaj zmianę</Button>
          )}
        </div>
      </div>

      {/* Publish warning banner */}
      {isAdmin && draftCount > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {draftCount} zmian{draftCount === 1 ? "a" : draftCount < 5 ? "y" : ""} w szkicu
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Pracownicy nie widzą zmian w statusie &quot;szkic&quot;. Kliknij &quot;Publikuj tydzień&quot;, aby udostępnić grafik.
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
      />

      {/* Availability panel - managers only */}
      {isAdmin && <AvailabilityPanel weekStart={weekStart} />}

      <SwapRequestsSection
        currentUserId={dbUser?.id ?? ""}
        currentUserRole={dbUser?.role ?? "EMPLOYEE"}
      />

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
    </div>
  );
}
