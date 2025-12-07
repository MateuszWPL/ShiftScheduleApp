"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, releaseShift, Shift, API_URL } from "@/lib/api";
import { ShiftCard } from "@/components/ShiftCard";
import { useSession, signIn, signOut } from "next-auth/react"; // <--- NextAuth
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session } = useSession(); // Pobieramy sesję z Google
  const queryClient = useQueryClient();
  const [dbUser, setDbUser] = useState<any>(null); // Tutaj trzymamy usera z naszej bazy

  // 1. Synchronizacja: Google -> Nasz Backend
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email;
      const name = session.user.name || "Nieznany";

      // Strzelamy do backendu, żeby dostać UUID
      fetch(`${API_URL}/shifts/users/sync?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(user => {
          console.log("Zalogowano jako (DB):", user);
          setDbUser(user);
          queryClient.invalidateQueries({ queryKey: ["shifts"] });
        });
    } else {
      setDbUser(null);
    }
  }, [session, queryClient]);

  // Pobieranie zmian
  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ["shifts"],
    queryFn: getShifts,
    enabled: !!dbUser, // Pobieraj tylko jak jesteśmy zalogowani
  });

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

  // WIDOK DLA NIEZALOGOWANEGO
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold">Shift Marketplace</h1>
          <p className="text-gray-500">Zaloguj się, aby zarządzać grafikiem.</p>
          <Button onClick={() => signIn("google")} className="w-full">
            Zaloguj przez Google
          </Button>
        </div>
      </div>
    );
  }

  // WIDOK DLA ZALOGOWANEGO (Dashboard)
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-xl font-bold">Witaj, {dbUser?.name || session.user?.name}</h1>
            <p className="text-xs text-gray-500">{dbUser?.role || "Synchronizacja..."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Wyloguj
          </Button>
        </div>

        {isLoading && <p>Ładowanie grafiku...</p>}

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