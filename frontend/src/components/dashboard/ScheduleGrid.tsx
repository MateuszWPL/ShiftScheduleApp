"use client";

import { paths } from "@/lib/app-paths";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShifts,
  getTeamMembers,
  claimAssignment,
  releaseAssignment,
  deleteShift,
  addAssignment,
  type Shift,
  type ShiftAssignment,
  type User,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  ShoppingBag,
  Pencil,
  Info,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TeamEmptyIllustration } from "@/components/brand/illustrations";
import { useState, useCallback, useMemo } from "react";

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

  // "unassigned" row for shifts without employee assignments
  for (const day of weekDays) {
    grid.set(`__unassigned__-${toLocalDateKey(day)}`, []);
  }

  for (const shift of shifts) {
    const shiftStart = new Date(shift.startTime);
    const dateKey = toLocalDateKey(shiftStart);
    if (!dayKeys.has(dateKey)) continue;

    const validAssignments = (shift.assignments ?? []).filter((a) => a.userId);

    if (validAssignments.length === 0) {
      // Shift without assignments → put in "unassigned" row
      const key = `__unassigned__-${dateKey}`;
      if (!grid.has(key)) grid.set(key, []);
      const fakeAssignment: ShiftAssignment = {
        id: `unassigned-${shift.id}`,
        shiftId: shift.id,
        userId: null,
        isUpForGrabs: false,
        user: null,
        shift,
      };
      grid.get(key)!.push({ assignment: fakeAssignment, shift });
    } else {
      for (const a of validAssignments) {
        const key = `${a.userId}-${dateKey}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push({ assignment: a, shift });
      }
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

function parseShiftTime(isoStr: string): string {
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "??";
}

function getShiftDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const hours = Math.round((end - start) / 3600000 * 10) / 10;
  if (hours === Math.floor(hours)) return `${hours}h`;
  return `${hours}h`;
}

export interface AvailabilityDropData {
  employeeId: string;
  employeeName: string;
  dateKey: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleGridProps {
  weekStart: Date;
  onWeekChange: (monday: Date) => void;
  currentUserId: string;
  currentUserRole: string;
  filterEmployeeId?: string | null;
  filterPositionId?: string | null;
  onCellClick?: (employeeId: string, dateKey: string) => void;
  onShiftClick?: (shift: Shift) => void;
  onDropAvailability?: (data: AvailabilityDropData) => void;
  onRefresh?: () => void;
}

export function ScheduleGrid({
  weekStart,
  onWeekChange,
  currentUserId,
  currentUserRole,
  filterEmployeeId,
  filterPositionId,
  onCellClick,
  onShiftClick,
  onDropAvailability,
}: ScheduleGridProps) {
  const queryClient = useQueryClient();
  const monday = getWeekMonday(weekStart);
  const weekDays = getWeekDays(monday);
  const from = monday.toISOString();
  const to = new Date(monday);
  to.setDate(to.getDate() + 7);
  const toStr = to.toISOString();
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Zmiana usunięta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignToShiftMutation = useMutation({
    mutationFn: ({ shiftId, userId }: { shiftId: string; userId: string }) =>
      addAssignment(shiftId, { userId, isUpForGrabs: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Pracownik przypisany do zmiany");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDragOver = useCallback(
    (e: React.DragEvent, cellKey: string) => {
      if (!onDropAvailability) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOverCell(cellKey);
    },
    [onDropAvailability]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, employeeId: string, dateKey: string) => {
      e.preventDefault();
      setDragOverCell(null);
      if (!onDropAvailability) return;
      try {
        const raw = e.dataTransfer.getData("application/availability");
        if (!raw) return;
        const data = JSON.parse(raw);
        onDropAvailability({
          employeeId,
          employeeName: data.employeeName || "",
          dateKey,
          startTime: data.start,
          endTime: data.end,
        });
      } catch {
        // ignore
      }
    },
    [onDropAvailability]
  );

  let employeesOnly = members.filter(
    (m) => (m as { role?: string }).role === "EMPLOYEE"
  );
  let filteredShifts = shifts;

  if (filterEmployeeId) {
    employeesOnly = employeesOnly.filter((m) => m.id === filterEmployeeId);
  }
  if (filterPositionId) {
    filteredShifts = shifts.filter((s) => s.positionId === filterPositionId || s.position?.id === filterPositionId);
    if (filterEmployeeId) {
      employeesOnly = employeesOnly.filter((m) =>
        (m as { positions?: { id: string }[] }).positions?.some((p) => p.id === filterPositionId)
      );
    } else {
      employeesOnly = employeesOnly.filter((m) =>
        (m as { positions?: { id: string }[] }).positions?.some((p) => p.id === filterPositionId)
      );
    }
  }

  const grid = buildGrid(filteredShifts, employeesOnly, weekDays);
  const isLoading = membersLoading || shiftsLoading;
  const canUseMarketplace = currentUserRole === "EMPLOYEE";
  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const draftCount = filteredShifts.filter((s) => s.status === "DRAFT").length;

  // Calculate weekly hours per employee (from filtered shifts)
  const weeklyHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const shift of filteredShifts) {
      const dur = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000;
      for (const a of shift.assignments ?? []) {
        if (a.userId) {
          map.set(a.userId, (map.get(a.userId) || 0) + dur);
        }
      }
    }
    return map;
  }, [filteredShifts]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={prevWeek} className="border-brand-warm hover:bg-brand-warm-light h-9 w-9 sm:h-8 sm:w-8 shrink-0 touch-manipulation" aria-label="Poprzedni tydzień">
            <ChevronLeft className="h-4 w-4 text-brand-dark-muted" />
          </Button>
          <span className="font-semibold text-brand-dark min-w-[160px] sm:min-w-[200px] text-center text-sm truncate">
            {weekLabel}
          </span>
          <Button variant="outline" size="icon" onClick={nextWeek} className="border-brand-warm hover:bg-brand-warm-light h-9 w-9 sm:h-8 sm:w-8 shrink-0 touch-manipulation" aria-label="Następny tydzień">
            <ChevronRight className="h-4 w-4 text-brand-dark-muted" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-xs text-brand hover:text-brand-light hover:bg-brand-muted ml-1 shrink-0 touch-manipulation min-h-[36px]">
            Dziś
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && draftCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <AlertTriangle className="h-3 w-3" />
              {draftCount} szkic{draftCount === 1 ? "" : draftCount < 5 ? "e" : "ów"}
            </span>
          )}
        </div>
      </div>

      {/* Legend + hints */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px] text-brand-dark-muted">
          {isAdmin && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm border-dashed border border-amber-300 bg-amber-50/60" />
                Szkic
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-blue-muted border border-brand-blue/30" />
                Opublikowana
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-muted border border-brand/30" />
                Na giełdzie
              </span>
            </>
          )}
        </div>
        {isAdmin && onCellClick && (
          <span className="flex items-center gap-1 text-[11px] text-brand-dark-soft" title="Kliknij komórkę lub przeciągnij blok z dostępności">
            <Info className="h-3 w-3" />
            Kliknij komórkę · przeciągnij dostępność
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="border border-brand-warm rounded-xl bg-white overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-[70vh] shadow-sm overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-brand-dark-muted text-sm">
              <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              Ładowanie grafiku...
            </div>
          </div>
        ) : employeesOnly.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-3">
              <TeamEmptyIllustration className="max-h-[80px]" />
            </div>
            <p className="text-sm font-medium text-brand-dark-muted">Brak pracowników w zespole</p>
            <p className="text-xs text-brand-dark-soft mt-1 mb-4">Zaproś członków, aby zobaczyć grafik.</p>
            <Link
              href={paths.team}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              Przejdź do pracowników
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-brand-warm-light/50 sticky top-0 z-10">
              <tr>
                <th className="text-left p-2 sm:p-2.5 border-b border-brand-warm font-semibold text-brand-dark min-w-[120px] sm:min-w-[160px] text-xs uppercase tracking-wider">
                  Pracownik
                </th>
                {weekDays.map((d) => {
                  const todayCol = isToday(d);
                  return (
                    <th
                      key={toLocalDateKey(d)}
                      className={`p-1.5 sm:p-2 border-b border-l border-brand-warm font-medium min-w-[80px] sm:min-w-[120px] text-center ${
                        todayCol ? "bg-brand-muted/50" : ""
                      }`}
                    >
                      <div className={`text-xs uppercase tracking-wide ${todayCol ? "text-brand font-semibold" : "text-brand-dark-muted"}`}>
                        {d.toLocaleDateString("pl-PL", { weekday: "short" })}
                      </div>
                      <div className={`text-sm font-semibold ${todayCol ? "text-brand" : "text-brand-dark"}`}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employeesOnly.map((member) => {
                const hours = weeklyHours.get(member.id) || 0;
                return (
                  <tr key={member.id} className="border-b border-brand-warm hover:bg-brand-warm-light/20 transition-colors">
                    <td className="p-2 sm:p-2.5 border-r border-brand-warm sticky left-0 bg-white z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-blue-muted flex items-center justify-center text-[10px] sm:text-xs font-bold text-brand-blue flex-shrink-0">
                          {(member.nickname || member.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-brand-dark truncate max-w-[70px] sm:max-w-[100px]">
                            {member.nickname || member.name}
                          </p>
                          {hours > 0 && (
                            <p className="text-[10px] text-brand-dark-soft flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {Math.round(hours * 10) / 10}h / tydzień
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {weekDays.map((day) => {
                      const dateKey = toLocalDateKey(day);
                      const key = `${member.id}-${dateKey}`;
                      const slots = grid.get(key) ?? [];
                      const todayCol = isToday(day);
                      const isEmpty = slots.length === 0;
                      const isDragOverCell = dragOverCell === key;

                      return (
                        <td
                          key={key}
                          className={`p-1 border-l border-brand-warm align-top min-w-[80px] sm:min-w-[120px] transition-colors ${
                            todayCol ? "bg-brand-muted/20" : ""
                          } ${
                            isAdmin && isEmpty ? "cursor-pointer hover:bg-brand-muted/30 group/cell" : ""
                          } ${isDragOverCell ? "!bg-emerald-50 ring-2 ring-inset ring-emerald-300" : ""}`}
                          onClick={() => {
                            if (isAdmin && isEmpty && onCellClick) {
                              onCellClick(member.id, dateKey);
                            }
                          }}
                          onDragOver={(e) => handleDragOver(e, key)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, member.id, dateKey)}
                        >
                          <div className="space-y-1 min-h-[44px] flex flex-col justify-center">
                            {isAdmin && isEmpty && onCellClick && !isDragOverCell && (
                              <div className="flex items-center justify-center h-[44px] opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                <div className="w-7 h-7 rounded-lg border-2 border-dashed border-brand/20 flex items-center justify-center">
                                  <Plus className="h-3.5 w-3.5 text-brand/40" />
                                </div>
                              </div>
                            )}
                            {isDragOverCell && isEmpty && (
                              <div className="flex items-center justify-center h-[44px] text-emerald-500 text-[11px] font-medium">
                                Upuść tutaj
                              </div>
                            )}

                            {slots.map(({ assignment, shift }) => {
                              const startTime = parseShiftTime(shift.startTime);
                              const endTime = parseShiftTime(shift.endTime);
                              const duration = getShiftDuration(shift.startTime, shift.endTime);
                              const isMine = assignment.userId === currentUserId;
                              const isOnMarketplace = assignment.isUpForGrabs;
                              const isDraft = shift.status === "DRAFT";
                              const canClaim = canUseMarketplace && isOnMarketplace && !isMine;
                              const canRelease = canUseMarketplace && isMine && !isOnMarketplace && !isDraft;

                              // Card styles based on status
                              let cardClasses = "rounded-lg p-2 transition-all text-xs relative group/shift";
                              let barColor = "bg-brand-blue";

                              if (isDraft) {
                                cardClasses += " border border-dashed border-amber-300/70 bg-amber-50/40";
                                barColor = "bg-amber-400";
                              } else if (isOnMarketplace) {
                                cardClasses += " border border-brand/20 bg-brand-muted/50";
                                barColor = "bg-brand";
                              } else if (isMine) {
                                cardClasses += " border border-brand-blue/20 bg-brand-blue-muted/50";
                                barColor = "bg-brand-blue";
                              } else {
                                cardClasses += " border border-brand-warm bg-white";
                                barColor = "bg-brand-blue/60";
                              }

                              if (isAdmin && onShiftClick) {
                                cardClasses += " cursor-pointer hover:shadow-md hover:-translate-y-px transition-shadow transition-transform duration-150";
                              }

                              return (
                                <div
                                  key={assignment.id}
                                  className={cardClasses}
                                  title={isAdmin ? "Kliknij, aby edytować" : undefined}
                                  onClick={(e) => {
                                    if (isAdmin && onShiftClick) {
                                      e.stopPropagation();
                                      onShiftClick(shift);
                                    }
                                  }}
                                >
                                  {/* Left color bar - use position color if available */}
                                  <div
                                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full ${shift.position ? "" : barColor}`}
                                    style={shift.position ? { backgroundColor: shift.position.color } : {}}
                                  />

                                  <div className="pl-2">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-semibold text-brand-dark leading-tight">
                                        {shift.roleName}
                                      </span>
                                      <div className="flex items-center gap-0.5 flex-shrink-0">
                                        {isDraft && isAdmin && (
                                          <span className="text-[9px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0 rounded">
                                            SZKIC
                                          </span>
                                        )}
                                        {isOnMarketplace && !canClaim && (
                                          <ShoppingBag className="h-3 w-3 text-brand/60" />
                                        )}
                                        {isAdmin && (
                                          <button
                                            className="opacity-0 group-hover/shift:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 text-brand-dark-soft hover:text-red-500 cursor-pointer"
                                            title="Usuń zmianę"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm("Czy na pewno chcesz usunąć tę zmianę?")) {
                                                deleteMutation.mutate(shift.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                        {isAdmin && onShiftClick && (
                                          <Pencil className="h-3 w-3 text-brand-dark-soft opacity-0 group-hover/shift:opacity-100 transition-opacity" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Time row */}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-brand-dark-muted text-[11px]">
                                        {startTime}–{endTime}
                                      </span>
                                      <span className="text-[10px] font-medium text-brand-dark-soft bg-brand-warm-light px-1 rounded">
                                        {duration}
                                      </span>
                                    </div>

                                    {/* Employee actions */}
                                    {canClaim && (
                                      <Button
                                        size="sm"
                                        className="mt-1.5 w-full h-6 text-[11px] bg-brand hover:bg-brand-light text-white"
                                        disabled={claimMutation.isPending}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          claimMutation.mutate(assignment.id);
                                        }}
                                      >
                                        Przejmij zmianę
                                      </Button>
                                    )}
                                    {canRelease && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-1.5 w-full h-6 text-[11px] border-brand-warm text-brand-dark-muted hover:text-brand hover:border-brand"
                                        disabled={releaseMutation.isPending}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          releaseMutation.mutate(assignment.id);
                                        }}
                                      >
                                        Oddaj na giełdę
                                      </Button>
                                    )}
                                    {isMine && isOnMarketplace && (
                                      <span className="text-brand text-[10px] mt-1 flex items-center gap-0.5">
                                        <ShoppingBag className="h-2.5 w-2.5" />
                                        Na giełdzie
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Unassigned shifts row */}
              {(() => {
                const hasUnassigned = weekDays.some((day) => {
                  const key = `__unassigned__-${toLocalDateKey(day)}`;
                  return (grid.get(key) ?? []).length > 0;
                });
                if (!hasUnassigned || !isAdmin) return null;
                return (
                  <tr className="border-b border-brand-warm bg-amber-50/30">
                    <td className="p-2.5 border-r border-brand-warm sticky left-0 bg-amber-50/50 z-[1]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
                          ?
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-amber-700 truncate max-w-[100px]">
                            Nieprzypisane
                          </p>
                          <p className="text-[10px] text-amber-500/60">
                            Wymagają przypisania
                          </p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dateKey = toLocalDateKey(day);
                      const key = `__unassigned__-${dateKey}`;
                      const slots = grid.get(key) ?? [];
                      const todayCol = isToday(day);

                      return (
                        <td
                          key={key}
                          className={`p-1 border-l border-brand-warm align-top min-w-[80px] sm:min-w-[120px] ${
                            todayCol ? "bg-brand-muted/20" : ""
                          }`}
                        >
                          <div className="space-y-1 min-h-[44px] flex flex-col justify-center">
                            {slots.map(({ shift }) => {
                              const startTime = parseShiftTime(shift.startTime);
                              const endTime = parseShiftTime(shift.endTime);
                              const duration = getShiftDuration(shift.startTime, shift.endTime);
                              const isDraft = shift.status === "DRAFT";

                              return (
                                <div
                                  key={shift.id}
                                  className={`rounded-lg p-2 text-xs relative group/shift border border-dashed border-amber-300/70 bg-amber-50/60 transition-colors ${
                                    onShiftClick ? "cursor-pointer hover:shadow-md hover:-translate-y-px" : ""
                                  }`}
                                  title="Kliknij, aby edytować i przypisać pracownika. Lub przeciągnij dostępność tutaj."
                                  onClick={(e) => {
                                    if (onShiftClick) {
                                      e.stopPropagation();
                                      onShiftClick(shift);
                                    }
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = "copy";
                                    (e.currentTarget as HTMLElement).classList.add("!bg-emerald-50", "!border-emerald-400");
                                  }}
                                  onDragLeave={(e) => {
                                    (e.currentTarget as HTMLElement).classList.remove("!bg-emerald-50", "!border-emerald-400");
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    (e.currentTarget as HTMLElement).classList.remove("!bg-emerald-50", "!border-emerald-400");
                                    try {
                                      const raw = e.dataTransfer.getData("application/availability");
                                      if (!raw) return;
                                      const data = JSON.parse(raw);
                                      if (data.userId) {
                                        assignToShiftMutation.mutate({ shiftId: shift.id, userId: data.userId });
                                      }
                                    } catch { /* ignore */ }
                                  }}
                                >
                                  <div
                                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full ${shift.position ? "" : "bg-amber-400"}`}
                                    style={shift.position ? { backgroundColor: shift.position.color } : {}}
                                  />
                                  <div className="pl-2">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-semibold text-brand-dark leading-tight">
                                        {shift.roleName}
                                      </span>
                                      <div className="flex items-center gap-0.5 flex-shrink-0">
                                        {isDraft && (
                                          <span className="text-[9px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0 rounded">
                                            SZKIC
                                          </span>
                                        )}
                                        <button
                                          className="opacity-0 group-hover/shift:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 text-brand-dark-soft hover:text-red-500"
                                          title="Usuń zmianę"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Czy na pewno chcesz usunąć tę zmianę?")) {
                                              deleteMutation.mutate(shift.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                        {onShiftClick && (
                                          <Pencil className="h-3 w-3 text-brand-dark-soft opacity-0 group-hover/shift:opacity-100 transition-opacity" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-brand-dark-muted text-[11px]">
                                        {startTime}–{endTime}
                                      </span>
                                      <span className="text-[10px] font-medium text-brand-dark-soft bg-brand-warm-light px-1 rounded">
                                        {duration}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })()}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
