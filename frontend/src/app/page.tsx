"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, releaseShift, createTeam, Shift, API_URL } from "@/lib/api"; // Dodaj createTeam
import { ShiftCard } from "@/components/ShiftCard";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [teamName, setTeamName] = useState(""); // Stan formularza

  // 1. Synchronizacja Usera
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email;
      const name = session.user.name || "Nieznany";

      fetch(`${API_URL}/shifts/users/sync?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(user => {
          setDbUser(user);
          queryClient.invalidateQueries({ queryKey: ["shifts"] });
        });
    }
  }, [session, queryClient]);

  // 2. Pobieranie zmian (TYLKO JEŚLI MAMY TEAM)
  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts", dbUser?.id], // Klucz zależny od usera
    queryFn: () => getShifts(dbUser.id), // Przekazujemy ID
    enabled: !!dbUser?.teamId, // <--- BLOKADA: Nie pobieraj, jak nie ma teamu
  });

  // Mutacje (bez zmian)
  const claimMutation = useMutation({
    mutationFn: (shiftId: string) => claimShift(shiftId, dbUser.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
    onError: (err) => alert(err.message),
  });

  const releaseMutation = useMutation({
    mutationFn: (shiftId: string) => releaseShift(shiftId, dbUser.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
    onError: (err) => alert(err.message),
  });

  // NOWOŚĆ: Tworzenie Teamu
  const createTeamMutation = useMutation({
    mutationFn: () => createTeam(dbUser.id, teamName),
    onSuccess: (data) => {
      // Backend zwraca { team, user }. Aktualizujemy lokalny stan.
      setDbUser(data.user);
      alert("Firma założona! Witaj Szefie.");
    },
    onError: (err) => alert(err.message),
  });
  // --- WIDOKI ---

  // A. Niezalogowany
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="p-8 bg-white rounded-xl shadow-lg text-center space-y-4">
          <h1 className="text-2xl font-bold">Shift Marketplace</h1>
          <Button onClick={() => signIn("google")}>Zaloguj przez Google</Button>
        </div>
      </div>
    );
  }

  // B. Zalogowany, ale BEZ FIRMY (Onboarding)
  if (dbUser && !dbUser.teamId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Witaj, {dbUser.name}!</h1>
            <p className="text-gray-500">Nie należysz jeszcze do żadnej firmy.</p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="font-semibold">Załóż nowy Workspace</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nazwa Twojej firmy (np. Pizzeria)"
                className="flex-1 p-2 border rounded"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <Button
                onClick={() => createTeamMutation.mutate()}
                disabled={!teamName || createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? "Tworzę..." : "Załóż"}
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4">
            Jeśli chcesz dołączyć do istniejącej firmy, poproś Managera o dodanie.
          </div>
          <Button variant="ghost" className="w-full" onClick={() => signOut()}>Wyloguj</Button>
        </div>
      </div>
    );
  }

  // C. Zalogowany z FIRMĄ (Dashboard)
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-xl font-bold">{dbUser?.name}</h1>
            {/* Wyświetlamy nazwę teamu, jeśli mamy ją w obiekcie usera (trzeba by dodać include w syncUser), 
                ale na razie wystarczy rola */}
            <p className="text-xs text-blue-600 font-bold uppercase">{dbUser?.role}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Wyloguj
          </Button>
        </div>

        <div className="grid gap-4">
          {shifts?.map((shift: Shift) => {
            const isMyShift = shift.userId === dbUser?.id;
            const isAvailable = shift.isUpForGrabs;

            // ... (logika przycisków taka sama jak wcześniej) ...
            let actionLabel = "Zajęte";
            let onAction = () => { };
            let disabled = true;
            let statusBadge: any = "claimed";

            if (isMyShift) {
              if (isAvailable) {
                statusBadge = "secondary";
                actionLabel = "Czeka na chętnego...";
              } else {
                statusBadge = "claimed";
                actionLabel = "Oddaj na giełdę";
                onAction = () => releaseMutation.mutate(shift.id);
                disabled = false;
              }
            } else {
              if (isAvailable) {
                statusBadge = "open";
                actionLabel = "Biorę to!";
                onAction = () => claimMutation.mutate(shift.id);
                disabled = false;
              } else {
                statusBadge = "claimed";
                actionLabel = "Zajęte przez kogoś";
              }
            }

            // Render ShiftCard (skopiuj ten fragment z poprzedniego page.tsx, jest taki sam)
            // Pamiętaj o formatowaniu daty!
            const timeStr = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <ShiftCard
                key={shift.id}
                role={shift.roleName + (isMyShift ? " (TY)" : "")}
                time={timeStr} // Uprościłem dla czytelności kodu tutaj
                status={statusBadge}
                actionLabel={actionLabel}
                actionDisabled={disabled}
                onAction={onAction}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}