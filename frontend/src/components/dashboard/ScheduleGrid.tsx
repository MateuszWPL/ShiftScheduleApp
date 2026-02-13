"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShifts,
  getTeamMembers,
  claimAssignment,
  releaseAssignment,
  type Shift,
  type ShiftAssignment,
  type User,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day; // poniedziałek = 1
  x.setDate(x.getDate() + diff);
  return x;
}

function getWeekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(x.getDate() + i);
    days.push(x);
  }
  return days;
}

type CellSlot = {
  assignment: ShiftAssignment;
  shift: Shift;
};

function buildGrid(
  shifts: Shift[],
  members: User[],
  weekDays: Date[]
): Map<string, CellSlot[]> {
  const dayKeys = new Set(weekDays.map(toLocalDateKey));
  const grid = new Map<string, CellSlot[]>();

  for (const m of members) {
    for (const day of weekDays) {
      grid.set(`${m.id}-${toLocalDateKey(day)}`, []);
    }
  }

  for (const shift of shifts) {
    const shiftStart = new Date(shift.startTime);
    const dateKey = toLocalDateKey(shiftStart);
    if (!dayKeys.has(dateKey)) continue;

    for (const a of shift.assignments ?? []) {
      const userId = a.userId ?? "unassigned";
      if (userId === "unassigned") continue;
      const key = `${userId}-${dateKey}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push({ assignment: a, shift });
    }
  }

  return grid;
}

interface ScheduleGridProps {
  weekStart: Date;
  onWeekChange: (monday: Date) => void;
  currentUserId: string;
  currentUserRole: string;
  onRefresh?: () => void;
}

export function ScheduleGrid({
  weekStart,
  onWeekChange,
  currentUserId,
  currentUserRole,
}: ScheduleGridProps) {
  const queryClient = useQueryClient();
  const monday = getWeekMonday(weekStart);
  const weekDays = getWeekDays(monday);
  const from = monday.toISOString();
  const to = new Date(monday);
  to.setDate(to.getDate() + 7);
  const toStr = to.toISOString();

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", from, toStr],
    queryFn: () => getShifts({ from, to: toStr }),
  });

  const claimMutation = useMutation({
    mutationFn: claimAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Pozycja przejęta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const releaseMutation = useMutation({
    mutationFn: releaseAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Pozycja oddana na giełdę");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grid = buildGrid(shifts, members, weekDays);
  const isLoading = membersLoading || shiftsLoading;

  const prevWeek = () => {
    const prev = new Date(monday);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(prev);
  };
  const nextWeek = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    onWeekChange(next);
  };

  const weekLabel = `${weekDays[0].toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek} aria-label="Poprzedni tydzień">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-slate-700 min-w-[200px] text-center">{weekLabel}</span>
          <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Następny tydzień">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white overflow-x-auto overflow-y-auto max-h-[70vh]">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Ładowanie grafiku...</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="text-left p-2 border-b border-slate-200 font-semibold text-slate-700 min-w-[140px]">
                  Pracownik
                </th>
                {weekDays.map((d) => (
                  <th
                    key={toLocalDateKey(d)}
                    className="p-2 border-b border-l border-slate-200 font-medium text-slate-600 min-w-[100px]"
                  >
                    {d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "numeric" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-2 border-r border-slate-100 font-medium text-slate-800 sticky left-0 bg-white z-[1]">
                    {member.nickname || member.name}
                  </td>
                  {weekDays.map((day) => {
                    const key = `${member.id}-${toLocalDateKey(day)}`;
                    const slots = grid.get(key) ?? [];
                    return (
                      <td
                        key={key}
                        className="p-1 border-l border-slate-100 align-top min-w-[100px]"
                      >
                        <div className="space-y-1">
                          {slots.map(({ assignment, shift }) => {
                            const timeStr = `${new Date(shift.startTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}–${new Date(shift.endTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
                            const isMine = assignment.userId === currentUserId;
                            const canClaim = assignment.isUpForGrabs && !isMine;
                            const canRelease = isMine && !assignment.isUpForGrabs;

                            return (
                              <div
                                key={assignment.id}
                                className="text-xs rounded border border-slate-200 bg-slate-50 p-1.5"
                              >
                                <div className="font-medium text-slate-800">{shift.roleName}</div>
                                <div className="text-slate-600">{timeStr}</div>
                                {(canRelease || canClaim) && (
                                  <Button
                                    size="sm"
                                    variant={canClaim ? "default" : "outline"}
                                    className="mt-1 w-full h-7 text-xs"
                                    disabled={
                                      (canClaim && claimMutation.isPending) ||
                                      (canRelease && releaseMutation.isPending)
                                    }
                                    onClick={() => {
                                      if (canClaim) claimMutation.mutate(assignment.id);
                                      else if (canRelease) releaseMutation.mutate(assignment.id);
                                    }}
                                  >
                                    {canClaim ? "Biorę" : "Oddaj"}
                                  </Button>
                                )}
                                {isMine && assignment.isUpForGrabs && (
                                  <span className="text-amber-600 text-xs">Na giełdzie</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
