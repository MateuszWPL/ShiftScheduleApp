"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTemplate,
  getPositions,
  type TemplateShiftInput,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FilePlus2,
  X,
  Loader2,
  Check,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAY_NAMES = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface ShiftRow {
  id: string;
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  roleName: string;
  positionId: string;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultShift(dayOfWeek: number): ShiftRow {
  return {
    id: makeId(),
    dayOfWeek,
    startHour: 8,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    roleName: "Zmiana",
    positionId: "",
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CreateTemplateDialog({
  isOpen,
  onClose,
}: CreateTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shifts, setShifts] = useState<ShiftRow[]>([defaultShift(0)]);
  const [activeDay, setActiveDay] = useState(0);

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    enabled: isOpen,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const templateShifts: TemplateShiftInput[] = shifts.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startHour: s.startHour,
        startMinute: s.startMinute,
        endHour: s.endHour,
        endMinute: s.endMinute,
        roleName: s.roleName || "Zmiana",
        positionId: s.positionId || undefined,
      }));
      return createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        shifts: templateShifts,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(`Szablon „${result.name}" został utworzony`);
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = () => {
    setName("");
    setDescription("");
    setShifts([defaultShift(0)]);
    setActiveDay(0);
    onClose();
  };

  const addShift = () => {
    setShifts((prev) => [...prev, defaultShift(activeDay)]);
  };

  const removeShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  const updateShift = (id: string, field: keyof ShiftRow, value: unknown) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  if (!isOpen) return null;

  const dayShifts = shifts.filter((s) => s.dayOfWeek === activeDay);
  const shiftCountByDay = DAY_NAMES.map(
    (_, i) => shifts.filter((s) => s.dayOfWeek === i).length
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-warm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center">
              <FilePlus2 className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Nowy szablon
              </h2>
              <p className="text-[11px] text-brand-dark-muted">
                Zdefiniuj zmiany od zera
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
          {/* Name & description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
                Nazwa *
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
                Opis
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis..."
                maxLength={500}
                className="mt-1.5 w-full px-3 py-2.5 text-sm border border-brand-warm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors"
              />
            </div>
          </div>

          {/* Day tabs */}
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Zmiany
            </label>
            <div className="mt-1.5 flex gap-1 overflow-x-auto pb-1 hide-scrollbar">
              {DAY_NAMES.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 touch-manipulation ${
                    activeDay === idx
                      ? "bg-brand text-white shadow-sm"
                      : "bg-brand-warm-light text-brand-dark-muted hover:bg-brand-warm"
                  }`}
                >
                  {day}
                  {shiftCountByDay[idx] > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                        activeDay === idx
                          ? "bg-white/20 text-white"
                          : "bg-brand-muted text-brand"
                      }`}
                    >
                      {shiftCountByDay[idx]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Shifts for active day */}
          <div className="space-y-2 min-h-[100px]">
            {dayShifts.length === 0 && (
              <p className="text-xs text-brand-dark-muted text-center py-4">
                Brak zmian na {DAY_NAMES[activeDay]}. Kliknij &quot;Dodaj
                zmianę&quot;.
              </p>
            )}
            {dayShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-3 rounded-xl border border-brand-warm bg-brand-warm-light/50 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-brand-dark-soft flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <select
                        value={shift.startHour}
                        onChange={(e) =>
                          updateShift(shift.id, "startHour", Number(e.target.value))
                        }
                        className="text-xs border border-brand-warm rounded-lg px-1.5 py-1 bg-white focus:ring-1 focus:ring-brand/20 outline-none"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {pad(h)}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-brand-dark-muted">:</span>
                      <select
                        value={shift.startMinute}
                        onChange={(e) =>
                          updateShift(
                            shift.id,
                            "startMinute",
                            Number(e.target.value)
                          )
                        }
                        className="text-xs border border-brand-warm rounded-lg px-1.5 py-1 bg-white focus:ring-1 focus:ring-brand/20 outline-none"
                      >
                        {[0, 15, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {pad(m)}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-brand-dark-muted mx-0.5">
                        –
                      </span>
                      <select
                        value={shift.endHour}
                        onChange={(e) =>
                          updateShift(shift.id, "endHour", Number(e.target.value))
                        }
                        className="text-xs border border-brand-warm rounded-lg px-1.5 py-1 bg-white focus:ring-1 focus:ring-brand/20 outline-none"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {pad(h)}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-brand-dark-muted">:</span>
                      <select
                        value={shift.endMinute}
                        onChange={(e) =>
                          updateShift(
                            shift.id,
                            "endMinute",
                            Number(e.target.value)
                          )
                        }
                        className="text-xs border border-brand-warm rounded-lg px-1.5 py-1 bg-white focus:ring-1 focus:ring-brand/20 outline-none"
                      >
                        {[0, 15, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {pad(m)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeShift(shift.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer touch-manipulation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shift.roleName}
                    onChange={(e) =>
                      updateShift(shift.id, "roleName", e.target.value)
                    }
                    placeholder="Nazwa roli"
                    className="flex-1 text-xs px-2.5 py-1.5 border border-brand-warm rounded-lg bg-white focus:ring-1 focus:ring-brand/20 outline-none"
                  />
                  {positions.length > 0 && (
                    <select
                      value={shift.positionId}
                      onChange={(e) =>
                        updateShift(shift.id, "positionId", e.target.value)
                      }
                      className="text-xs border border-brand-warm rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-brand/20 outline-none max-w-[140px]"
                    >
                      <option value="">Stanowisko</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addShift}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-brand-warm text-xs font-medium text-brand-dark-muted hover:border-brand hover:text-brand hover:bg-brand-muted/30 transition-colors cursor-pointer touch-manipulation"
            >
              <Plus className="h-3.5 w-3.5" />
              Dodaj zmianę na {DAY_NAMES[activeDay]}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-warm flex items-center justify-between gap-3">
          <span className="text-xs text-brand-dark-muted">
            {shifts.length} zmian{shifts.length === 1 ? "a" : shifts.length < 5 ? "y" : ""} łącznie
          </span>
          <div className="flex items-center gap-2">
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
                shifts.length === 0
              }
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tworzenie...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Utwórz szablon
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
