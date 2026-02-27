"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { createTeam, joinTeam } from "@/lib/api";
import { toast } from "sonner";

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
    mutationFn: () => createTeam(teamName),
    onSuccess: (data) => {
      toast.success("Firma założona!", {
        description: "Możesz teraz zapraszać pracowników.",
      });
      onSuccess(data.user);
    },
    onError: (err: Error) => {
      toast.error("Błąd tworzenia firmy", {
        description: err.message,
      });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: () => joinTeam(inviteCode),
    onSuccess: (result: any) => {
      if (result?.status === "PENDING") {
        toast.info("Zgłoszenie wysłane", {
          description: "Czekaj na akceptację managera. Otrzymasz powiadomienie gdy zostaniesz zaakceptowany.",
        });
        onSuccess({ 
          id: userId,
          name: userName,
          email: "",
          teamId: result.team?.id || null,
          membershipStatus: "PENDING",
          team: result.team,
        });
      } else {
        toast.success("Dołączono do zespołu!", {
          description: "Możesz teraz przeglądać grafik zmian.",
        });
        onSuccess(result);
      }
    },
    onError: (err: Error) => {
      toast.error("Błąd dołączania do zespołu", {
        description: err.message,
      });
    },
  });

  return (
    <div className="flex h-screen items-center justify-center bg-brand-surface">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Witaj, {userName}!</h1>
          <p className="text-brand-dark-muted">Wybierz swoją ścieżkę.</p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-blue-600">Dołącz do zespołu</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Kod Zespołu"
              className="flex-1 p-2 border rounded bg-brand-warm-light"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              disabled={joinTeamMutation.isPending}
            />
            <Button
              onClick={() => joinTeamMutation.mutate()}
              disabled={!inviteCode || joinTeamMutation.isPending}
            >
              {joinTeamMutation.isPending ? "Wysyłanie..." : "Dołącz"}
            </Button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-brand-warm"></div>
          <span className="flex-shrink mx-4 text-brand-dark-muted text-sm">LUB</span>
          <div className="flex-grow border-t border-brand-warm"></div>
        </div>

        {/* ZAŁÓŻ */}
        <div className="space-y-4">
          <h2 className="font-semibold text-brand-dark">Załóż nową firmę</h2>
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