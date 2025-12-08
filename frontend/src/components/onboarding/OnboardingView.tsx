"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { createTeam, joinTeam } from "@/lib/api";

interface Props {
  userId: string;
  userName: string;
  onSuccess: (user: any) => void;
  onLogout: () => void;
}

export function OnboardingView({ userId, userName, onSuccess, onLogout }: Props) {
  const [inviteCode, setInviteCode] = useState("");
  const [teamName, setTeamName] = useState("");

  const createTeamMutation = useMutation({
    mutationFn: () => createTeam(teamName), // userId jest teraz z tokena - BEZPIECZNIE
    onSuccess: (data) => {
      alert("Firma założona!");
      onSuccess(data.user);
    },
    onError: (err) => alert(err.message),
  });

  const joinTeamMutation = useMutation({
    mutationFn: () => joinTeam(inviteCode), // userId jest teraz z tokena - BEZPIECZNIE
    onSuccess: (updatedUser) => {
      alert("Dołączono do zespołu!");
      onSuccess(updatedUser);
    },
    onError: (err) => alert(err.message),
  });

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Witaj, {userName}!</h1>
          <p className="text-gray-500">Wybierz swoją ścieżkę.</p>
        </div>

        {/* DOŁĄCZ */}
        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-blue-600">Dołącz do zespołu</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Kod Zespołu"
              className="flex-1 p-2 border rounded bg-slate-50"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <Button
              onClick={() => joinTeamMutation.mutate()}
              disabled={!inviteCode || joinTeamMutation.isPending}
            >
              Dołącz
            </Button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">LUB</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* ZAŁÓŻ */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900">Załóż nową firmę</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nazwa Firmy"
              className="flex-1 p-2 border rounded"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => createTeamMutation.mutate()}
              disabled={!teamName || createTeamMutation.isPending}
            >
              Załóż
            </Button>
          </div>
        </div>

        <Button variant="ghost" className="w-full mt-4" onClick={onLogout}>
          Wyloguj
        </Button>
      </div>
    </div>
  );
}