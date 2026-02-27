"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  previewCopyWeek,
  copyWeek,
  type CopyWeekPreviewItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Copy,
  X,
  ChevronRight,
  Users,
  Clock,
  Loader2,
  AlertTriangle,
  Check,
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

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function parseTime(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m?.[1] ?? "??";
}

function parseDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

interface CopyWeekDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeekStart: Date;
  onNavigateToWeek?: (monday: Date) => void;
}

type Step = "configure" | "preview";

export function CopyWeekDialog({ isOpen, onClose, currentWeekStart, onNavigateToWeek }: CopyWeekDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("configure");
  const [structureOnly, setStructureOnly] = useState(false);
  const [targetOffset, setTargetOffset] = useState(1);
  const [preview, setPreview] = useState<CopyWeekPreviewItem[]>([]);

  const sourceMonday = useMemo(() => getWeekMonday(currentWeekStart), [currentWeekStart]);
  const targetMonday = useMemo(() => {
    const d = new Date(sourceMonday);
    d.setDate(d.getDate() + targetOffset * 7);
    return d;
  }, [sourceMonday, targetOffset]);

  const sourceKey = toLocalDateKey(sourceMonday);
  const targetKey = toLocalDateKey(targetMonday);

  const previewMutation = useMutation({
    mutationFn: () =>
      previewCopyWeek({
        sourceWeekStart: sourceKey,
        targetWeekStart: targetKey,
        structureOnly,
      }),
    onSuccess: (data) => {
      setPreview(data);
      setStep("preview");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyMutation = useMutation({
    mutationFn: () =>
      copyWeek({
        sourceWeekStart: sourceKey,
        targetWeekStart: targetKey,
        structureOnly,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(`Skopiowano ${result.copied} zmian jako szkice`);
      onNavigateToWeek?.(targetMonday);
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = () => {
    setStep("configure");
    setPreview([]);
    setStructureOnly(false);
    setTargetOffset(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-warm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center">
              <Copy className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">Kopiuj tydzień</h2>
              <p className="text-[11px] text-brand-dark-muted">
                {step === "configure" ? "Wybierz opcje kopiowania" : "Podgląd zmian do skopiowania"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-brand-warm-light transition-colors text-brand-dark-muted hover:text-brand-dark">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === "configure" && (
            <>
              {/* Source week */}
              <div>
                <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">Źródłowy tydzień</label>
                <div className="mt-1.5 p-3 bg-brand-warm-light border border-brand-warm rounded-xl flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-dark-soft" />
                  <span className="text-sm font-semibold text-brand-dark">{formatWeekRange(sourceMonday)}</span>
                </div>
              </div>

              {/* Target week offset */}
              <div>
                <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">Docelowy tydzień</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    onClick={() => setTargetOffset((v) => Math.max(-12, v - 1))}
                    disabled={targetOffset <= -12}
                    className="w-9 h-9 rounded-lg border border-brand-warm flex items-center justify-center text-brand-dark-muted hover:bg-brand-warm-light disabled:opacity-30 transition-colors"
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
                    onClick={() => setTargetOffset((v) => Math.min(12, v + 1))}
                    disabled={targetOffset >= 12}
                    className="w-9 h-9 rounded-lg border border-brand-warm flex items-center justify-center text-brand-dark-muted hover:bg-brand-warm-light disabled:opacity-30 transition-colors"
                  >
                    ›
                  </button>
                </div>
                {targetOffset === 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Docelowy tydzień jest taki sam jak źródłowy
                  </p>
                )}
              </div>

              {/* Copy mode */}
              <div>
                <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">Tryb kopiowania</label>
                <div className="mt-1.5 space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      !structureOnly ? "border-brand bg-brand-muted/30" : "border-brand-warm hover:bg-brand-warm-light"
                    }`}
                  >
                    <input
                      type="radio"
                      name="copyMode"
                      checked={!structureOnly}
                      onChange={() => setStructureOnly(false)}
                      className="mt-0.5 accent-brand"
                    />
                    <div>
                      <p className="text-sm font-medium text-brand-dark">Z pracownikami</p>
                      <p className="text-xs text-brand-dark-muted">Kopiuje zmiany razem z przypisanymi pracownikami</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      structureOnly ? "border-brand bg-brand-muted/30" : "border-brand-warm hover:bg-brand-warm-light"
                    }`}
                  >
                    <input
                      type="radio"
                      name="copyMode"
                      checked={structureOnly}
                      onChange={() => setStructureOnly(true)}
                      className="mt-0.5 accent-brand"
                    />
                    <div>
                      <p className="text-sm font-medium text-brand-dark">Tylko struktura</p>
                      <p className="text-xs text-brand-dark-muted">Kopiuje same godziny i stanowiska, bez pracowników</p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {step === "preview" && (
            <>
              <div className="flex items-center gap-2 text-xs text-brand-dark-muted">
                <span className="font-medium">{formatWeekRange(sourceMonday)}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-brand">{formatWeekRange(targetMonday)}</span>
              </div>

              {preview.length === 0 ? (
                <div className="text-center py-8 text-brand-dark-muted">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-brand-dark-soft" />
                  <p className="text-sm font-medium">Brak zmian do skopiowania</p>
                  <p className="text-xs mt-1">Źródłowy tydzień jest pusty.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-brand-dark-muted">
                    {preview.length} zmian{preview.length === 1 ? "a" : preview.length < 5 ? "y" : ""} zostaną skopiowane jako szkice:
                  </p>
                  <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                    {preview.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-brand-warm-light border border-brand-warm text-sm"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-brand-dark">{item.roleName}</span>
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                              SZKIC
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-brand-dark-muted mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{parseDate(item.newStartTime)}</span>
                            <span>{parseTime(item.newStartTime)}–{parseTime(item.newEndTime)}</span>
                          </div>
                          {item.assignees.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-brand-dark-soft mt-1">
                              <Users className="h-3 w-3" />
                              {item.assignees.map((a) => a.name).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-warm flex items-center justify-between gap-3">
          {step === "preview" && (
            <Button
              variant="ghost"
              className="text-brand-dark-muted"
              onClick={() => setStep("configure")}
            >
              Wróć
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" className="text-brand-dark-muted" onClick={handleClose}>
              Anuluj
            </Button>
            {step === "configure" && (
              <Button
                className="bg-brand hover:bg-brand-light text-white gap-1.5"
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending || targetOffset === 0}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ładowanie...
                  </>
                ) : (
                  <>
                    Podgląd
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            {step === "preview" && preview.length > 0 && (
              <Button
                className="bg-brand hover:bg-brand-light text-white gap-1.5"
                onClick={() => copyMutation.mutate()}
                disabled={copyMutation.isPending}
              >
                {copyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Kopiowanie...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Kopiuj {preview.length} zmian
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
