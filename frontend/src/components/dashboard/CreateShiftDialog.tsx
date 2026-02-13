"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createShift, addAssignment, getTeamMembers } from "@/lib/api";
import { toast } from "sonner";
import { TimeBlockStrip, minutesToTime } from "./TimeBlockStrip";

const MIN_SHIFT_MINUTES = 60;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateShiftDialog({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [timeBlock, setTimeBlock] = useState<{ startMin: number; endMin: number } | null>(null);
  const [assignToId, setAssignToId] = useState<string>("");
  const [isUpForGrabs, setIsUpForGrabs] = useState(false);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled: isOpen,
  });

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
        description: "Zmiana została dodana do grafiku.",
      });
      onClose();
      setRoleName("");
      setShiftDate("");
      setTimeBlock(null);
      setAssignToId("");
      setIsUpForGrabs(false);
    },
    onError: (err: Error) => {
      toast.error("Błąd tworzenia zmiany", {
        description: err.message || "Spróbuj ponownie.",
      });
    },
  });

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];
  const defaultDate = shiftDate || today;
  const canSubmit = roleName.trim() && shiftDate && timeBlock && timeBlock.endMin > timeBlock.startMin;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Dodaj nową zmianę</h2>
        <p className="text-sm text-slate-600 mb-4">
          Kliknij na pasmo godzin, aby ustawić przedział. Przeciągnij blok, aby przesunąć; za brzegi — aby skrócić lub wydłużyć.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stanowisko / Rola *
            </label>
            <input
              type="text"
              placeholder="np. Kelner, Barista"
              className="w-full p-2 border border-slate-300 rounded-lg"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              className="w-full p-2 border border-slate-300 rounded-lg"
              value={defaultDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Godziny — kliknij na pasmo lub przeciągnij blok *
            </label>
            <TimeBlockStrip
              label={defaultDate}
              minBlockMinutes={MIN_SHIFT_MINUTES}
              singleBlock
              value={timeBlock}
              onChange={setTimeBlock}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Przypisz do
            </label>
            <select
              className="w-full p-2 border rounded bg-white"
              value={assignToId}
              onChange={(e) => setAssignToId(e.target.value)}
            >
              <option value="">— Wolna pozycja —</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nickname || m.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isUpForGrabs}
              onChange={(e) => setIsUpForGrabs(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Wystaw na giełdę (do przejęcia)</span>
          </label>

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="ghost" onClick={onClose}>
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

