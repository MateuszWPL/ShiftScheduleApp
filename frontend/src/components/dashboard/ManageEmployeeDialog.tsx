"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateEmployee,
  getPositions,
  assignPositionsToEmployee,
  User,
  PrivateUser,
  type Position,
} from "@/lib/api";
import { toast } from "sonner";
import { UserIcon, DollarSign, Clock, Tag, X, FileText, Briefcase } from "lucide-react";

interface Props {
  managerId: string;
  targetUser: User | null;
  onClose: () => void;
}

export function ManageEmployeeDialog({ managerId, targetUser, onClose }: Props) {
  const queryClient = useQueryClient();
  const privateUser = targetUser as PrivateUser;
  
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    enabled: !!targetUser,
  });

  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || "");
      setNickname(targetUser.nickname || "");
      setHourlyRate(
        privateUser?.hourlyRate !== null && privateUser?.hourlyRate !== undefined
          ? privateUser.hourlyRate.toString()
          : ""
      );
      setMaxHours(
        privateUser?.maxHours !== null && privateUser?.maxHours !== undefined
          ? privateUser.maxHours.toString()
          : ""
      );
      setSkillsInput(targetUser.skills?.join(", ") || "");
      setNotes(privateUser?.notes || "");
      setSelectedPositionIds(targetUser.positions?.map((p: Position) => p.id) || []);
    }
  }, [targetUser, privateUser]);

  const mutation = useMutation({
    mutationFn: async () => {
      const skillsArray = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updateData: any = {};
      
      if (name.trim() !== targetUser?.name) {
        updateData.name = name.trim();
      }
      
      if (nickname.trim() !== (targetUser?.nickname || "")) {
        updateData.nickname = nickname.trim() || null;
      }
      
      if (hourlyRate !== "") {
        const rate = parseFloat(hourlyRate);
        if (!isNaN(rate) && rate !== privateUser?.hourlyRate) {
          updateData.hourlyRate = rate;
        }
      } else if (privateUser?.hourlyRate !== null && privateUser?.hourlyRate !== undefined) {
        updateData.hourlyRate = null;
      }
      
      if (maxHours !== "") {
        const hours = parseInt(maxHours);
        if (!isNaN(hours) && hours !== privateUser?.maxHours) {
          updateData.maxHours = hours;
        }
      } else if (privateUser?.maxHours !== null && privateUser?.maxHours !== undefined) {
        updateData.maxHours = null;
      }
      
      if (JSON.stringify(skillsArray.sort()) !== JSON.stringify((targetUser?.skills || []).sort())) {
        updateData.skills = skillsArray;
      }
      
      if (notes.trim() !== (privateUser?.notes || "")) {
        updateData.notes = notes.trim() || null;
      }

      await updateEmployee(targetUser!.id, updateData);

      const currentPosIds = (targetUser?.positions || []).map((p: Position) => p.id).sort();
      const newPosIds = [...selectedPositionIds].sort();
      if (JSON.stringify(currentPosIds) !== JSON.stringify(newPosIds)) {
        await assignPositionsToEmployee(targetUser!.id, selectedPositionIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Zaktualizowano pracownika!", {
        description: `Dane ${targetUser?.name || "pracownika"} zostały zaktualizowane.`,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Edytuj pracownika</h2>
            <p className="text-sm text-gray-500 mt-1">{targetUser.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Imię i Nazwisko *
            </label>
            <Input
              type="text"
              placeholder="Jan Kowalski"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Pseudonim (opcjonalny)
            </label>
            <Input
              type="text"
              placeholder="np. Jasiu"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Widoczny dla całego zespołu
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Stawka godzinowa (PLN/h)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="np. 25.50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Zostaw puste aby usunąć
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Max. godziny/tydzień
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                max="168"
                placeholder="np. 40"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Zostaw puste aby usunąć
              </p>
            </div>
          </div>

          {/* Position assignment */}
          {positions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Stanowiska
              </label>
              <div className="flex flex-wrap gap-2">
                {positions.map((pos) => {
                  const isSelected = selectedPositionIds.includes(pos.id);
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        setSelectedPositionIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== pos.id)
                            : [...prev, pos.id]
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? "border-transparent text-white shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                      }`}
                      style={isSelected ? { backgroundColor: pos.color } : {}}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${isSelected ? "bg-white/60" : ""}`}
                        style={!isSelected ? { backgroundColor: pos.color } : {}}
                      />
                      {pos.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Kliknij, aby przypisać lub usunąć stanowisko. Pracownik może mieć wiele stanowisk.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Dodatkowe umiejętności
            </label>
            <Input
              type="text"
              placeholder="np. Certyfikat BHP, Prawo jazdy B"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Oddziel przecinkami. Dodatkowe tagi i certyfikaty.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notatki administracyjne
            </label>
            <textarea
              placeholder="Wewnętrzne notatki o pracowniku (widoczne tylko dla administratorów)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-md min-h-[100px] resize-y text-sm"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {notes.length}/1000 znaków. Widoczne tylko dla administratorów.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
