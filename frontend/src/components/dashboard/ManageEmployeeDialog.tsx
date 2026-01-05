"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEmployeeSkills, User } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  managerId: string;
  targetUser: User | null; // Jeśli null, modal zamknięty
  onClose: () => void;
}

export function ManageEmployeeDialog({ managerId, targetUser, onClose }: Props) {
  const queryClient = useQueryClient();
  const [skillsInput, setSkillsInput] = useState(targetUser?.skills?.join(", ") || "");

  const mutation = useMutation({
    mutationFn: () => {
      // Zamień string "Barista, Kierowca" na tablicę ["Barista", "Kierowca"]
      const skillsArray = skillsInput.split(",").map(s => s.trim()).filter(s => s.length > 0);
      return updateEmployeeSkills(targetUser!.id, skillsArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Zaktualizowano pracownika!", {
        description: `Umiejętności ${targetUser?.name || "pracownika"} zostały zaktualizowane.`,
      });
      onClose();
    },
    onError: (err: Error) => {
      toast.error("Błąd aktualizacji pracownika", {
        description: err.message,
      });
    },
  });

  if (!targetUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-1">Zarządzaj: {targetUser.name}</h2>
        <p className="text-sm text-gray-500 mb-4">{targetUser.email}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Umiejętności / Stanowiska (oddziel przecinkami)
            </label>
            <input
              type="text"
              placeholder="np. Barista, Kierowca, Kuchnia, Klucze"
              className="w-full p-2 border rounded bg-slate-50"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Te tagi pomogą Ci przy układaniu grafiku.
            </p>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="ghost" onClick={onClose}>Anuluj</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              Zapisz Zmiany
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}