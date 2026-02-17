"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShift,
  addAssignment,
  updateShift,
  getTeamMembers,
  type Shift,
} from "@/lib/api";
import { toast } from "sonner";
import { X, Clock } from "lucide-react";

function generateTimeOptions(): { value: string; label: string; minutes: number }[] {
  const options: { value: string; label: string; minutes: number }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      options.push({ value: val, label: val, minutes: h * 60 + m });
    }
  }
  options.push({ value: "24:00", label: "24:00", minutes: 1440 });
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export interface ShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill date (YYYY-MM-DD) */
  prefilledDate?: string;
  /** Pre-fill employee ID */
  prefilledEmployeeId?: string;
  /** Edit mode: existing shift data */
  editShift?: Shift | null;
}

export function CreateShiftDialog({
  isOpen,
  onClose,
  prefilledDate,
  prefilledEmployeeId,
  editShift,
}: ShiftDialogProps) {
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [assignToId, setAssignToId] = useState<string>("");
  const [isUpForGrabs, setIsUpForGrabs] = useState(false);

  const isEdit = !!editShift;

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled: isOpen,
  });

  const employees = teamMembers.filter(
    (m) => (m as { role?: string }).role === "EMPLOYEE"
  );

  // Set initial values when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    if (editShift) {
      setRoleName(editShift.roleName);
      // Parse times from ISO without timezone conversion
      const startMatch = editShift.startTime.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      const endMatch = editShift.endTime.match(/T(\d{2}:\d{2})/);
      if (startMatch) {
        setShiftDate(startMatch[1]);
        setStartTime(startMatch[2]);
      }
      if (endMatch) {
        setEndTime(endMatch[1]);
      }
      // Set assigned employee from first assignment
      const firstAssignment = editShift.assignments?.[0];
      setAssignToId(firstAssignment?.userId ?? "");
      setIsUpForGrabs(firstAssignment?.isUpForGrabs ?? false);
    } else {
      setRoleName("");
      setShiftDate(prefilledDate || new Date().toISOString().split("T")[0]);
      setStartTime("08:00");
      setEndTime("16:00");
      setAssignToId(prefilledEmployeeId || "");
      setIsUpForGrabs(false);
    }
  }, [isOpen, editShift, prefilledDate, prefilledEmployeeId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!shiftDate || !startTime || !endTime)
        throw new Error("Uzupełnij datę i godziny");

      // Send datetime strings directly without .toISOString() to avoid timezone shift
      const startISO = `${shiftDate}T${startTime}:00`;
      const endISO = `${shiftDate}T${endTime}:00`;

      if (isEdit && editShift) {
        const updated = await updateShift(editShift.id, {
          startTime: startISO,
          endTime: endISO,
          roleName,
        });
        return updated;
      }

      const shift = await createShift({
        startTime: startISO,
        endTime: endISO,
        roleName,
      });
      await addAssignment(shift.id, {
        userId: assignToId || undefined,
        isUpForGrabs,
      });
      return shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success(isEdit ? "Zmiana zaktualizowana" : "Zmiana utworzona!", {
        description: isEdit
          ? "Dane zmiany zostały zapisane."
          : "Zmiana została dodana do grafiku jako szkic.",
      });
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(isEdit ? "Błąd edycji zmiany" : "Błąd tworzenia zmiany", {
        description: err.message || "Spróbuj ponownie.",
      });
    },
  });

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Compute duration
  const startMinutes =
    TIME_OPTIONS.find((t) => t.value === startTime)?.minutes ?? 0;
  const endMinutes =
    TIME_OPTIONS.find((t) => t.value === endTime)?.minutes ?? 0;
  const durationMinutes = endMinutes - startMinutes;
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationStr =
    durationMinutes > 0
      ? `${durationHours}h${durationMins > 0 ? ` ${durationMins}min` : ""}`
      : "";

  const canSubmit =
    roleName.trim() && shiftDate && startTime && endTime && endMinutes > startMinutes;

  // Get selected employee name for header
  const selectedEmployee = employees.find((e) => e.id === assignToId);
  const selectedEmployeeName = selectedEmployee
    ? selectedEmployee.nickname || selectedEmployee.name
    : null;

  // Filter end time options to only show times after start time
  const validEndTimes = TIME_OPTIONS.filter(
    (t) => t.minutes > startMinutes
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? "Edytuj zmianę" : "Dodaj zmianę"}
            </h2>
            {!isEdit && selectedEmployeeName && (
              <p className="text-sm text-slate-500 mt-0.5">
                Dla: <span className="font-medium text-slate-700">{selectedEmployeeName}</span>
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {!isEdit && (
            <p className="text-xs text-slate-400">
              Zmiana zostanie utworzona jako{" "}
              <Badge
                variant="outline"
                className="text-[10px] border-amber-300 text-amber-600 bg-amber-50 mx-0.5"
              >
                szkic
              </Badge>
            </p>
          )}

          {/* Role name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Stanowisko / Rola <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="np. Kelner, Barista, Kucharz"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
          </div>

          {/* Time picker row */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Clock className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
              Godziny <span className="text-red-500">*</span>
              {durationStr && (
                <span className="ml-2 font-normal text-blue-600 text-xs">
                  ({durationStr})
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 p-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  // Auto-adjust end time if needed
                  const newStartMin =
                    TIME_OPTIONS.find((t) => t.value === e.target.value)
                      ?.minutes ?? 0;
                  if (endMinutes <= newStartMin) {
                    const autoEnd = TIME_OPTIONS.find(
                      (t) => t.minutes >= newStartMin + 60
                    );
                    if (autoEnd) setEndTime(autoEnd.value);
                  }
                }}
              >
                {TIME_OPTIONS.filter((t) => t.minutes < 1440).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 font-medium">—</span>
              <select
                className="flex-1 p-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {validEndTimes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assign to employee (only for create mode) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Przypisz do
              </label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={assignToId}
                onChange={(e) => setAssignToId(e.target.value)}
              >
                <option value="">— Wolna pozycja —</option>
                {employees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nickname || m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Marketplace checkbox (only for create mode) */}
          {!isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isUpForGrabs}
                onChange={(e) => setIsUpForGrabs(e.target.checked)}
                className="rounded border-gray-300 h-4 w-4"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">
                  Wystaw na giełdę
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pracownicy będą mogli przejąć tę zmianę
                </p>
              </div>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={handleClose}>
              Anuluj
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !canSubmit}
            >
              {createMutation.isPending
                ? isEdit
                  ? "Zapisywanie..."
                  : "Tworzenie..."
                : isEdit
                ? "Zapisz zmiany"
                : "Utwórz zmianę"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
