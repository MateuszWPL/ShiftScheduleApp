"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShift,
  addAssignment,
  getTeamMembers,
} from "@/lib/api";
import { toast } from "sonner";
import { TimeBlockStrip, minutesToTime } from "./TimeBlockStrip";
import { X } from "lucide-react";

const MIN_SHIFT_MINUTES = 60;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateShiftDialog({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [timeBlock, setTimeBlock] = useState<{
    startMin: number;
    endMin: number;
  } | null>(null);
  const [assignToId, setAssignToId] = useState<string>("");
  const [isUpForGrabs, setIsUpForGrabs] = useState(false);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled: isOpen,
  });

  const employees = teamMembers.filter(
    (m) => (m as { role?: string }).role === "EMPLOYEE"
  );

  // Note: Real-time validation requires an existing shift to validate against.
  // Validation happens server-side when the assignment is created (addAssignment).
  // The validation result is shown in the error toast if it fails.

  const mutation = useMutation({
    mutationFn: async () => {
      if (!shiftDate || !timeBlock) throw new Error("Ustaw datę i godziny");
      const { start, end } = minutesToTime(timeBlock.startMin, timeBlock.endMin);
      const startDateTime = new Date(`${shiftDate}T${start}:00`).toISOString();
      const endDateTime = new Date(`${shiftDate}T${end}:00`).toISOString();

      const shift = await createShift({
        startTime: startDateTime,
        endTime: endDateTime,
        roleName: roleName,
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
      toast.success("Zmiana utworzona!", {
        description: "Zmiana została dodana do grafiku jako szkic.",
      });
      handleClose();
    },
    onError: (err: Error) => {
      toast.error("Błąd tworzenia zmiany", {
        description: err.message || "Spróbuj ponownie.",
      });
    },
  });

  const handleClose = () => {
    onClose();
    setRoleName("");
    setShiftDate("");
    setTimeBlock(null);
    setAssignToId("");
    setIsUpForGrabs(false);
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];
  const defaultDate = shiftDate || today;
  const canSubmit =
    roleName.trim() && shiftDate && timeBlock && timeBlock.endMin > timeBlock.startMin;

  const hasTimeInfo = shiftDate && timeBlock;
  const timeLabel = hasTimeInfo
    ? (() => {
        const { start, end } = minutesToTime(timeBlock!.startMin, timeBlock!.endMin);
        const duration = timeBlock!.endMin - timeBlock!.startMin;
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return `${start}–${end} (${hours}h${mins > 0 ? ` ${mins}min` : ""})`;
      })()
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            Dodaj nową zmianę
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Zmiana zostanie utworzona jako <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50 mx-0.5">szkic</Badge>.
          Opublikuj grafik, aby pracownicy mogli ją zobaczyć.
        </p>

        <div className="space-y-5">
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
              value={defaultDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
          </div>

          {/* Time block */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Godziny <span className="text-red-500">*</span>
              {timeLabel && (
                <span className="ml-2 font-normal text-blue-600">
                  {timeLabel}
                </span>
              )}
            </label>
            <TimeBlockStrip
              label={defaultDate}
              minBlockMinutes={MIN_SHIFT_MINUTES}
              singleBlock
              value={timeBlock}
              onChange={setTimeBlock}
            />
          </div>

          {/* Assign to employee */}
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

          {/* Marketplace checkbox */}
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

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={handleClose}>
              Anuluj
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !canSubmit}
            >
              {mutation.isPending ? "Tworzenie..." : "Utwórz zmianę"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
