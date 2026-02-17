"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShifts,
  getTeamMembers,
  claimAssignment,
  releaseAssignment,
  createSwapRequest,
  type Shift,
  type ShiftAssignment,
  type User,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
  const diff = day === 0 ? -6 : 1 - day;
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

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Parse ISO time without timezone shift
 */
function parseShiftTime(isoStr: string): string {
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : new Date(isoStr).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShiftCardClasses(
  shift: Shift,
  isMine: boolean,
  isOnMarketplace: boolean
): string {
  const base = "text-xs rounded-lg border p-1.5 transition-all";

  if (shift.status === "DRAFT") {
    return `${base} border-dashed border-amber-300 bg-amber-50/60 opacity-80`;
  }
  if (isOnMarketplace) {
    return `${base} border-orange-300 bg-orange-50`;
  }
  if (isMine) {
    return `${base} border-blue-200 bg-blue-50`;
  }
  return `${base} border-slate-200 bg-slate-50 hover:border-slate-300`;
}

export interface ScheduleGridProps {
  weekStart: Date;
  onWeekChange: (monday: Date) => void;
  currentUserId: string;
  currentUserRole: string;
  /** Called when admin clicks an empty cell to create a shift */
  onCellClick?: (employeeId: string, dateKey: string) => void;
  /** Called when admin clicks an existing shift to edit */
  onShiftClick?: (shift: Shift) => void;
  onRefresh?: () => void;
}

export function ScheduleGrid({
  weekStart,
  onWeekChange,
  currentUserId,
  currentUserRole,
  onCellClick,
  onShiftClick,
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

  const swapMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      createSwapRequest({ assignmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swap-requests"] });
      toast.success("Prośba o zamianę utworzona");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const employeesOnly = members.filter(
    (m) => (m as { role?: string }).role === "EMPLOYEE"
  );
  const grid = buildGrid(shifts, employeesOnly, weekDays);
  const isLoading = membersLoading || shiftsLoading;
  const canUseMarketplace = currentUserRole === "EMPLOYEE";
  const isAdmin =
    currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const draftCount = shifts.filter((s) => s.status === "DRAFT").length;

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
  const goToday = () => onWeekChange(new Date());

  const weekLabel = `${weekDays[0].toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })} – ${weekDays[6].toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek} aria-label="Poprzedni tydzień">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-slate-700 min-w-[200px] text-center">
            {weekLabel}
          </span>
          <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Następny tydzień">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-xs text-slate-500 ml-1">
            Dziś
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && draftCount > 0 && (
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {draftCount} szkic{draftCount === 1 ? "" : draftCount < 5 ? "e" : "ów"}
            </Badge>
          )}
        </div>
      </div>

      {/* Legend */}
      {isAdmin && (
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded border-dashed border border-amber-300 bg-amber-50/60" />
            Szkic (DRAFT)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded border border-slate-200 bg-slate-50" />
            Opublikowana
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded border border-orange-300 bg-orange-50" />
            Na giełdzie
          </span>
          {onCellClick && (
            <span className="text-blue-500 ml-2">
              Kliknij pustą komórkę, aby dodać zmianę
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-x-auto overflow-y-auto max-h-[70vh] shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">
            Ładowanie grafiku...
          </div>
        ) : employeesOnly.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Brak pracowników w zespole. Zaproś członków, aby zobaczyć grafik.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="text-left p-2 border-b border-slate-200 font-semibold text-slate-700 min-w-[140px]">
                  Pracownik
                </th>
                {weekDays.map((d) => {
                  const todayCol = isToday(d);
                  return (
                    <th
                      key={toLocalDateKey(d)}
                      className={`p-2 border-b border-l border-slate-200 font-medium min-w-[110px] ${
                        todayCol ? "bg-blue-50 text-blue-700" : "text-slate-600"
                      }`}
                    >
                      <div>{d.toLocaleDateString("pl-PL", { weekday: "short" })}</div>
                      <div className="text-xs">
                        {d.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employeesOnly.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                  <td className="p-2 border-r border-slate-100 font-medium text-slate-800 sticky left-0 bg-white z-[1]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                        {(member.nickname || member.name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <span className="truncate max-w-[100px]">
                        {member.nickname || member.name}
                      </span>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const dateKey = toLocalDateKey(day);
                    const key = `${member.id}-${dateKey}`;
                    const slots = grid.get(key) ?? [];
                    const todayCol = isToday(day);
                    const isEmpty = slots.length === 0;

                    return (
                      <td
                        key={key}
                        className={`p-1 border-l border-slate-100 align-top min-w-[110px] ${
                          todayCol ? "bg-blue-50/30" : ""
                        } ${
                          isAdmin && isEmpty
                            ? "cursor-pointer hover:bg-blue-50/40 group/cell"
                            : ""
                        }`}
                        onClick={() => {
                          if (isAdmin && isEmpty && onCellClick) {
                            onCellClick(member.id, dateKey);
                          }
                        }}
                      >
                        <div className="space-y-1 min-h-[36px]">
                          {/* Empty cell: show "+" hint for admins */}
                          {isAdmin && isEmpty && onCellClick && (
                            <div className="flex items-center justify-center h-[36px] opacity-0 group-hover/cell:opacity-100 transition-opacity">
                              <Plus className="h-4 w-4 text-blue-400" />
                            </div>
                          )}

                          {slots.map(({ assignment, shift }) => {
                            const timeStr = `${parseShiftTime(shift.startTime)}–${parseShiftTime(shift.endTime)}`;
                            const isMine = assignment.userId === currentUserId;
                            const isOnMarketplace = assignment.isUpForGrabs;
                            const isDraft = shift.status === "DRAFT";
                            const canClaim = canUseMarketplace && isOnMarketplace && !isMine;
                            const canRelease = canUseMarketplace && isMine && !isOnMarketplace && !isDraft;

                            return (
                              <div
                                key={assignment.id}
                                className={`${getShiftCardClasses(shift, isMine, isOnMarketplace)} ${
                                  isAdmin && onShiftClick ? "cursor-pointer hover:shadow-sm" : ""
                                }`}
                                onClick={(e) => {
                                  if (isAdmin && onShiftClick) {
                                    e.stopPropagation();
                                    onShiftClick(shift);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-slate-800 truncate">
                                    {shift.roleName}
                                  </span>
                                  {isDraft && isAdmin && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1 py-0 border-amber-300 text-amber-600 bg-amber-50"
                                    >
                                      szkic
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  {timeStr}
                                </div>

                                {canClaim && (
                                  <Button
                                    size="sm"
                                    className="mt-1 w-full h-6 text-xs"
                                    disabled={claimMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      claimMutation.mutate(assignment.id);
                                    }}
                                  >
                                    Biorę
                                  </Button>
                                )}
                                {canRelease && (
                                  <div className="flex gap-1 mt-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 h-6 text-xs"
                                      disabled={releaseMutation.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        releaseMutation.mutate(assignment.id);
                                      }}
                                    >
                                      Oddaj
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      title="Poproś o zamianę"
                                      disabled={swapMutation.isPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        swapMutation.mutate(assignment.id);
                                      }}
                                    >
                                      <ArrowRightLeft className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                {isMine && isOnMarketplace && (
                                  <span className="text-amber-600 text-[10px] mt-0.5 block">
                                    Na giełdzie
                                  </span>
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
