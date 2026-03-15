"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTemplateFromWeek, getShifts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BookmarkPlus,
  X,
  Loader2,
  Check,
  Clock,
  Calendar,
} from "lucide-react";

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: Date;
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

const DAY_NAMES = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

function parseTime(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m?.[1] ?? "??";
}

export function SaveAsTemplateDialog({
  isOpen,
  onClose,
  weekStart,
}: SaveAsTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const weekKey = toLocalDateKey(weekStart);
  const toDate = new Date(weekStart);
  toDate.setDate(toDate.getDate() + 7);

  const { data: weekShifts = [] } = useQuery({
    queryKey: ["shifts", weekStart.toISOString(), toDate.toISOString()],
    queryFn: () =>
      getShifts({ from: weekStart.toISOString(), to: toDate.toISOString() }),
    enabled: isOpen,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      createTemplateFromWeek({
        name: name.trim(),
        description: description.trim() || undefined,
        weekStart: weekKey,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(`Szablon „${result.name}" został zapisany`);
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  const shiftsByDay: Record<number, typeof weekShifts> = {};
  weekShifts.forEach((s) => {
    const d = new Date(s.startTime);
    const dow = d.getUTCDay();
    const adjusted = dow === 0 ? 6 : dow - 1;
    if (!shiftsByDay[adjusted]) shiftsByDay[adjusted] = [];
    shiftsByDay[adjusted].push(s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-warm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center">
              <BookmarkPlus className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Zapisz jako szablon
              </h2>
              <p className="text-[11px] text-brand-dark-muted">
                Zapisz tydzień {formatWeekRange(weekStart)} jako szablon
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
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Nazwa szablonu *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='np. "Tydzień standardowy"'
              maxLength={100}
              className="mt-1.5 w-full px-3 py-2.5 text-sm border border-brand-warm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Opis (opcjonalnie)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krótki opis szablonu..."
              maxLength={500}
              rows={2}
              className="mt-1.5 w-full px-3 py-2.5 text-sm border border-brand-warm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors resize-none"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Podgląd zmian ({weekShifts.length})
            </label>
            {weekShifts.length === 0 ? (
              <p className="text-sm text-brand-dark-muted mt-2">
                Brak zmian w tym tygodniu.
              </p>
            ) : (
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
                            className="flex items-center gap-2 p-2 rounded-lg bg-brand-warm-light border border-brand-warm text-xs"
                          >
                            <Clock className="h-3 w-3 text-brand-dark-soft flex-shrink-0" />
                            <span className="font-medium text-brand-dark">
                              {parseTime(s.startTime)}–{parseTime(s.endTime)}
                            </span>
                            <span className="text-brand-dark-muted truncate">
                              {s.roleName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending ||
              !name.trim() ||
              weekShifts.length === 0
            }
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Zapisz szablon
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
