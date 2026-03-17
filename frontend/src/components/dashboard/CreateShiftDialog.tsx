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
  getPositions,
  type Shift,
  type Position,
  type User,
} from "@/lib/api";
import { useLocation } from "@/components/providers/LocationContext";
import { toast } from "sonner";
import { X, Clock, Briefcase, AlertCircle } from "lucide-react";

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
  prefilledDate?: string;
  prefilledEmployeeId?: string;
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
  const { activeLocationId } = useLocation();
  const [positionId, setPositionId] = useState<string>("");
  const [customRoleName, setCustomRoleName] = useState("");
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

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    enabled: isOpen,
  });

  const employees = teamMembers.filter(
    (m) => (m as { role?: string }).role === "EMPLOYEE"
  );

  const filteredEmployees = useMemo(() => {
    if (!positionId) return employees;
    return employees.filter((emp) =>
      emp.positions?.some((p: Position) => p.id === positionId)
    );
  }, [employees, positionId]);

  const selectedPosition = positions.find((p) => p.id === positionId);
  const roleName = selectedPosition ? selectedPosition.name : customRoleName;

  useEffect(() => {
    if (!isOpen) return;

    if (editShift) {
      if (editShift.positionId) {
        setPositionId(editShift.positionId);
        setCustomRoleName("");
      } else {
        setPositionId("");
        setCustomRoleName(editShift.roleName);
      }
      const startMatch = editShift.startTime.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      const endMatch = editShift.endTime.match(/T(\d{2}:\d{2})/);
      if (startMatch) {
        setShiftDate(startMatch[1]);
        setStartTime(startMatch[2]);
      }
      if (endMatch) {
        setEndTime(endMatch[1]);
      }
      const firstAssignment = editShift.assignments?.[0];
      setAssignToId(firstAssignment?.userId ?? "");
      setIsUpForGrabs(firstAssignment?.isUpForGrabs ?? false);
    } else {
      setPositionId("");
      setCustomRoleName("");
      setShiftDate(prefilledDate || new Date().toISOString().split("T")[0]);
      setStartTime("08:00");
      setEndTime("16:00");
      setAssignToId(prefilledEmployeeId || "");
      setIsUpForGrabs(false);

      // Auto-select position based on prefilled employee
      if (prefilledEmployeeId && positions.length > 0) {
        const emp = employees.find((e) => e.id === prefilledEmployeeId);
        if (emp?.positions?.length === 1) {
          setPositionId(emp.positions[0].id);
        }
      }
    }
  }, [isOpen, editShift, prefilledDate, prefilledEmployeeId, positions.length]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!shiftDate || !startTime || !endTime)
        throw new Error("Uzupełnij datę i godziny");

      const startISO = `${shiftDate}T${startTime}:00`;
      const endISO = `${shiftDate}T${endTime}:00`;
      const realPositionId = positionId && positionId !== "__custom__" ? positionId : undefined;

      if (isEdit && editShift) {
        const updated = await updateShift(editShift.id, {
          startTime: startISO,
          endTime: endISO,
          positionId: realPositionId,
          roleName: realPositionId ? undefined : customRoleName,
        });

        const currentAssignment = editShift.assignments?.[0];
        const currentUserId = currentAssignment?.userId ?? "";
        if (assignToId && assignToId !== currentUserId) {
          await addAssignment(editShift.id, {
            userId: assignToId,
            isUpForGrabs,
          });
        }

        return updated;
      }

      const shift = await createShift({
        startTime: startISO,
        endTime: endISO,
        positionId: realPositionId,
        roleName: realPositionId ? undefined : customRoleName,
        locationId: activeLocationId ?? undefined,
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

  const hasValidRole = (positionId && positionId !== "__custom__") || customRoleName.trim();
  const canSubmit =
    hasValidRole && shiftDate && startTime && endTime && endMinutes > startMinutes;

  const selectedEmployee = employees.find((e) => e.id === assignToId);
  const selectedEmployeeName = selectedEmployee
    ? selectedEmployee.nickname || selectedEmployee.name
    : null;

  const validEndTimes = TIME_OPTIONS.filter(
    (t) => t.minutes > startMinutes
  );

  // Check if the assigned employee matches the selected position
  const employeePositionMismatch =
    assignToId &&
    positionId &&
    !filteredEmployees.find((e) => e.id === assignToId);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-brand-warm">
          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              {isEdit ? "Edytuj zmianę" : "Dodaj zmianę"}
            </h2>
            {!isEdit && selectedEmployeeName && (
              <p className="text-sm text-brand-dark-muted mt-0.5">
                Dla: <span className="font-medium text-brand-dark">{selectedEmployeeName}</span>
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
            <p className="text-xs text-brand-dark-soft">
              Zmiana zostanie utworzona jako{" "}
              <Badge
                variant="outline"
                className="text-[10px] border-amber-300 text-amber-600 bg-amber-50 mx-0.5"
              >
                szkic
              </Badge>
            </p>
          )}

          {/* Position selector */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              <Briefcase className="inline h-3.5 w-3.5 mr-1 text-brand-dark-soft" />
              Stanowisko <span className="text-red-500">*</span>
            </label>
            {positions.length > 0 ? (
              <>
                <select
                  className="w-full p-2.5 border border-brand-warm rounded-lg bg-white text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
                  value={positionId}
                  onChange={(e) => {
                    setPositionId(e.target.value);
                    if (e.target.value) setCustomRoleName("");
                  }}
                >
                  <option value="">— Wybierz stanowisko —</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__custom__">✏️ Wpisz ręcznie...</option>
                </select>
                {positionId === "__custom__" && (
                  <input
                    type="text"
                    placeholder="Nazwa stanowiska"
                    className="w-full mt-2 p-2.5 border border-brand-warm rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
                    value={customRoleName}
                    onChange={(e) => {
                      setCustomRoleName(e.target.value);
                      setPositionId("__custom__");
                    }}
                    autoFocus
                  />
                )}
                {selectedPosition && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedPosition.color }}
                    />
                    <span className="text-[11px] text-brand-dark-soft">
                      {selectedPosition._count?.employees ?? 0} pracowników na tym stanowisku
                    </span>
                  </div>
                )}
              </>
            ) : (
              <input
                type="text"
                placeholder="np. Kelner, Barista, Kucharz"
                className="w-full p-2.5 border border-brand-warm rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-2.5 border border-brand-warm rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
          </div>

          {/* Time picker row */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              <Clock className="inline h-3.5 w-3.5 mr-1 text-brand-dark-soft" />
              Godziny <span className="text-red-500">*</span>
              {durationStr && (
                <span className="ml-2 font-normal text-brand text-xs">
                  ({durationStr})
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 p-2.5 border border-brand-warm rounded-lg bg-white text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
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
              <span className="text-brand-dark-soft font-medium">—</span>
              <select
                className="flex-1 p-2.5 border border-brand-warm rounded-lg bg-white text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
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

          {/* Assign to employee */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5">
              Przypisz do
              {positionId && positionId !== "__custom__" && (
                <span className="ml-1 text-xs font-normal text-brand">
                  (filtrowane wg stanowiska)
                </span>
              )}
            </label>
            <select
              className="w-full p-2.5 border border-brand-warm rounded-lg bg-white text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-colors"
              value={assignToId}
              onChange={(e) => setAssignToId(e.target.value)}
            >
              <option value="">— Wolna pozycja —</option>
              {positionId && positionId !== "__custom__" ? (
                <>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nickname || m.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Brak pracowników na tym stanowisku</option>
                  )}
                  {employees.filter((e) => !filteredEmployees.includes(e)).length > 0 && (
                    <>
                      <option disabled>────── Pozostali ──────</option>
                      {employees
                        .filter((e) => !filteredEmployees.includes(e))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nickname || m.name}
                          </option>
                        ))}
                    </>
                  )}
                </>
              ) : (
                employees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nickname || m.name}
                  </option>
                ))
              )}
            </select>
            {employeePositionMismatch && assignToId && (
              <div className="flex items-center gap-1.5 mt-1.5 text-amber-600">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="text-[11px]">
                  Ten pracownik nie ma przypisanego wybranego stanowiska
                </span>
              </div>
            )}
          </div>

          {/* Marketplace checkbox (only for create mode) */}
          {!isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-brand-warm hover:bg-brand-warm-light transition-colors">
              <input
                type="checkbox"
                checked={isUpForGrabs}
                onChange={(e) => setIsUpForGrabs(e.target.checked)}
                className="rounded border-brand-warm h-4 w-4"
              />
              <div>
                <span className="text-sm font-medium text-brand-dark">
                  Wystaw na giełdę
                </span>
                <p className="text-xs text-brand-dark-muted mt-0.5">
                  Pracownicy będą mogli przejąć tę zmianę
                </p>
              </div>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t border-brand-warm">
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
