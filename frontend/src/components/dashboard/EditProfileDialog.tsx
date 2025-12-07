"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, User } from "@/lib/api";

interface Props {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ user, isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phoneNumber || "");

  const mutation = useMutation({
    mutationFn: () => updateUserProfile(user.id, name, phone),
    onSuccess: () => {
      // Musimy odświeżyć dane, żeby w Dashboardzie pojawiło się nowe imię
      // Uwaga: To zależy jak pobierasz usera w page.tsx (przez syncUser). 
      // Najlepiej byłoby zrobić reload strony lub inwalidację.
      alert("Profil zaktualizowany!");
      window.location.reload(); // Brutalne, ale skuteczne w MVP przy syncUser
    },
    onError: (err) => alert(err.message),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Edytuj Profil</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Imię i Nazwisko</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefon</label>
            <input
              type="tel"
              placeholder="+48 000 000 000"
              className="mt-1 w-full p-2 border rounded"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="ghost" onClick={onClose}>Anuluj</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              Zapisz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}