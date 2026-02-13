"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createShift, addAssignment, getTeamMembers } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateShiftDialog({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assignToId, setAssignToId] = useState<string>("");
  const [isUpForGrabs, setIsUpForGrabs] = useState(false);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();

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
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
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

  // Ustaw domyślne wartości dat (dzisiaj)
  const today = new Date().toISOString().split("T")[0];
  const defaultStartDate = startDate || today;
  const defaultEndDate = endDate || today;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Dodaj Nową Zmianę</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stanowisko / Rola *
            </label>
            <input
              type="text"
              placeholder="np. Kelner, Barista, Kierowca"
              className="w-full p-2 border rounded"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data rozpoczęcia *
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={defaultStartDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Godzina rozpoczęcia *
              </label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data zakończenia *
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={defaultEndDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Godzina zakończenia *
              </label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
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
              disabled={mutation.isPending || !roleName || !startDate || !startTime || !endDate || !endTime}
            >
              {mutation.isPending ? "Tworzenie..." : "Utwórz Zmianę"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

