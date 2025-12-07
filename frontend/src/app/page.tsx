"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, releaseShift, Shift, API_URL } from "@/lib/api";
import { ShiftCard } from "@/components/ShiftCard";
import { OnboardingView } from "@/components/onboarding/OnboardingView"; // <--- NOWY IMPORT
import { TeamList } from "@/components/dashboard/TeamList"; // <--- NOWY IMPORT
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [dbUser, setDbUser] = useState<any>(null);

  // 1. Sync User
  useEffect(() => {
    if (session?.user?.email) {
      const { email, name } = session.user;
      fetch(`${API_URL}/shifts/users/sync?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || "")}`)
        .then(res => res.json())
        .then(user => {
          setDbUser(user);
          queryClient.invalidateQueries({ queryKey: ["shifts"] });
        });
    }
  }, [session, queryClient]);

  // 2. Pobieranie zmian
  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts", dbUser?.id],
    queryFn: () => getShifts(dbUser.id),
    enabled: !!dbUser?.teamId,
  });

  // Mutacje
  const claimMutation = useMutation({
    mutationFn: (shiftId: string) => claimShift(shiftId, dbUser.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const releaseMutation = useMutation({
    mutationFn: (shiftId: string) => releaseShift(shiftId, dbUser.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  // --- RENDERING ---

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

  // Używamy nowego komponentu OnboardingView
  if (dbUser && !dbUser.teamId) {
    return (
      <OnboardingView
        userId={dbUser.id}
        userName={dbUser.name}
        onSuccess={setDbUser}
        onLogout={() => signOut()}
      />
    );
  }

  // Dashboard Właściwy
  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* KOLUMNA LEWA: Info + Zespół */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-bold text-lg">{dbUser?.name}</h2>
            <p className="text-sm text-blue-600 font-bold uppercase">{dbUser?.role}</p>

            {dbUser?.role === 'OWNER' && dbUser?.team?.inviteCode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-center">
                <p className="text-xs text-blue-600 font-bold">KOD ZESPOŁU:</p>
                <p className="text-xl font-mono tracking-widest cursor-pointer select-all">
                  {dbUser.team.inviteCode}
                </p>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => signOut()}>
              Wyloguj
            </Button>
          </div>

          {/* NOWY FEATURE: Lista Zespołu */}
          <TeamList userId={dbUser?.id} />
        </div>

        {/* KOLUMNA PRAWA: Grafik (2/3 szerokości) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Grafik Zmian</h2>

          {isLoading && <p>Ładowanie...</p>}
          {shifts?.length === 0 && <p className="text-gray-500">Brak zmian w grafiku.</p>}

          <div className="grid gap-4">
            {shifts?.map((shift: Shift) => {
              const isMyShift = shift.userId === dbUser?.id;
              const isAvailable = shift.isUpForGrabs;
              const timeStr = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              // Logika UI
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
                  actionLabel = "Zajęte";
                }
              }

              return (
                <ShiftCard
                  key={shift.id}
                  role={shift.roleName + (isMyShift ? " (TY)" : "")}
                  time={timeStr}
                  status={statusBadge}
                  actionLabel={actionLabel}
                  actionDisabled={disabled}
                  onAction={onAction}
                />
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}