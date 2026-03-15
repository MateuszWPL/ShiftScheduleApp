"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyTemplate, getTemplate, type ScheduleTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Play,
  X,
  Loader2,
  Check,
  ChevronRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ApplyTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: ScheduleTemplate | null;
  onApplied?: (weekStart: Date) => void;
}

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

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const DAY_NAMES = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

export function ApplyTemplateDialog({
  isOpen,
  onClose,
  template,
  onApplied,
}: ApplyTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);

  const targetMonday = useMemo(() => {
    const base = getWeekMonday(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const { data: fullTemplate } = useQuery({
    queryKey: ["template", template?.id],
    queryFn: () => getTemplate(template!.id),
    enabled: isOpen && !!template?.id,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      applyTemplate(template!.id, toLocalDateKey(targetMonday)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(
        `Zastosowano „${result.templateName}" — ${result.created} zmian jako szkice`
      );
      onApplied?.(targetMonday);
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = () => {
    setWeekOffset(0);
    onClose();
  };

  if (!isOpen || !template) return null;

  const shifts = fullTemplate?.shifts ?? [];

  const shiftsByDay: Record<number, typeof shifts> = {};
  shifts.forEach((s) => {
    if (!shiftsByDay[s.dayOfWeek]) shiftsByDay[s.dayOfWeek] = [];
    shiftsByDay[s.dayOfWeek].push(s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-warm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center">
              <Play className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Zastosuj szablon
              </h2>
              <p className="text-[11px] text-brand-dark-muted truncate max-w-[200px]">
                {template.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-brand-warm-light transition-colors duration-150 text-brand-dark-muted hover:text-brand-dark cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Week selector */}
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Docelowy tydzień
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((v) => Math.max(-12, v - 1))}
                disabled={weekOffset <= -12}
                className="w-9 h-9 rounded-lg border border-brand-warm flex items-center justify-center text-brand-dark-muted hover:bg-brand-warm-light disabled:opacity-30 transition-colors cursor-pointer"
              >
                ‹
              </button>
              <div className="flex-1 p-3 bg-brand-muted/50 border border-brand/20 rounded-xl flex items-center justify-center gap-2">
                <ChevronRight className="h-4 w-4 text-brand" />
                <span className="text-sm font-semibold text-brand-dark">
                  {formatWeekRange(targetMonday)}
                </span>
              </div>
              <button
                onClick={() => setWeekOffset((v) => Math.min(12, v + 1))}
                disabled={weekOffset >= 12}
                className="w-9 h-9 rounded-lg border border-brand-warm flex items-center justify-center text-brand-dark-muted hover:bg-brand-warm-light disabled:opacity-30 transition-colors cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>

          {/* Shift preview */}
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Zmiany do utworzenia ({shifts.length})
            </label>
            <div className="mt-2 space-y-2 max-h-[35vh] overflow-y-auto pr-1">
              {DAY_NAMES.map((dayName, idx) => {
                const dayShifts = shiftsByDay[idx] || [];
                if (dayShifts.length === 0) return null;
                return (
                  <div key={idx}>
                    <p className="text-xs font-semibold text-brand-dark mb-1">
                      {dayName}
                    </p>
                    <div className="space-y-1">
                      {dayShifts.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-brand-warm-light border border-brand-warm text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="h-3 w-3 text-brand-dark-soft flex-shrink-0" />
                            <span className="font-medium text-brand-dark">
                              {pad(s.startHour)}:{pad(s.startMinute)}–
                              {pad(s.endHour)}:{pad(s.endMinute)}
                            </span>
                            <span className="text-brand-dark-muted truncate">
                              {s.roleName}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                            SZKIC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {shifts.length === 0 && (
                <div className="text-center py-6 text-brand-dark-muted">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-brand-dark-soft" />
                  <p className="text-sm">Szablon jest pusty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-warm flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="text-brand-dark-muted"
            onClick={handleClose}
          >
            Anuluj
          </Button>
          <Button
            className="bg-brand hover:bg-brand-light text-white gap-1.5"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || shifts.length === 0}
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Stosowanie...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Zastosuj ({shifts.length} zmian)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
