"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, releaseShift, createTeam, Shift, API_URL, joinTeam } from "@/lib/api"; // Dodaj createTeam
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
  const [inviteCode, setInviteCode] = useState("");
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
  const joinTeamMutation = useMutation({
    mutationFn: () => joinTeam(dbUser.id, inviteCode),
    onSuccess: (updatedUser) => {
      setDbUser(updatedUser);
      alert("Dołączono do zespołu!");
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

  // B. Zalogowany, ale BEZ FIRMY
  if (dbUser && !dbUser.teamId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Witaj, {dbUser.name}!</h1>
            <p className="text-gray-500">Wybierz swoją ścieżkę.</p>
          </div>

          {/* OPCJA 1: DOŁĄCZ */}
          <div className="space-y-4 pt-4 border-t">
            <h2 className="font-semibold text-blue-600">Jestem pracownikiem</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Wpisz Kod Zespołu"
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
            <p className="text-xs text-gray-400">Poproś Managera o kod dostępu.</p>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">LUB</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* OPCJA 2: ZAŁÓŻ (Tu przenieś kod createTeamMutation z poprzedniej wersji) */}
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Jestem Managerem/Szefem</h2>
            {/* ... input name i button Załóż ... */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nazwa Nowej Firmy"
                className="flex-1 p-2 border rounded"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => createTeamMutation.mutate()}
                disabled={!teamName || createTeamMutation.isPending}
              >
                Załóż Firmę
              </Button>
            </div>
          </div>

          <Button variant="ghost" className="w-full mt-4" onClick={() => signOut()}>Wyloguj</Button>
        </div>
      </div>
    );
  }

  // C. Zalogowany z FIRMĄ (Dashboard)
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{dbUser?.name}</h1>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>Wyloguj</Button>
          </div>

          {/* Wyświetlanie KODU tylko jeśli jesteś w Teamie (pobierz go przy syncUser w backendzie!) 
              UWAGA: Żeby to zadziałało, musisz w 'shifts.service.ts' w metodzie syncUser 
              dołączyć dane o teamie: include: { team: true } 
          */}
          {dbUser?.role === 'OWNER' && dbUser?.team?.inviteCode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
              <p className="text-xs text-blue-600 uppercase font-bold">Kod zaproszenia dla pracowników:</p>
              <p className="text-2xl font-mono tracking-widest text-blue-900 select-all cursor-pointer">
                {dbUser.team.inviteCode}
              </p>
            </div>
          )}
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