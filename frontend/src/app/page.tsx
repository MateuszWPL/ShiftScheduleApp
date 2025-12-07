"use client";

import { useState, useEffect } from "react"; // Dodaj useEffect
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, releaseShift, Shift } from "@/lib/api";
import { ShiftCard } from "@/components/ShiftCard";
import { UserSwitcher } from "@/components/UserSwitcher"; // Import

export default function Home() {
  const queryClient = useQueryClient();

  // DOMYŚLNY USER (Janusz) - w prawdziwej apce to przyjdzie z Auth
  // Możesz zostawić tu pusty string na start, ale lepiej dać ID Janusza na sztywno jako default
  const [currentUserId, setCurrentUserId] = useState("e8ee0d69-e52b-40b1-87b0-5d8e310f57b1");

  // Resetujemy widok po zmianie usera
  const handleUserChange = (newId: string) => {
    setCurrentUserId(newId);
    queryClient.invalidateQueries({ queryKey: ["shifts"] });
  };

  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ["shifts"],
    queryFn: getShifts,
  });

  // 2. Mutacja: BIORĘ (Claim)
  const claimMutation = useMutation({
    mutationFn: (shiftId: string) => claimShift(shiftId, currentUserId), // <--- TUTAJ ZMIANA
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      // alert("Sukces! Zmiana przejęta."); // Opcjonalnie wyłącz alerty, są wkurzające
    },
    onError: (err) => alert(`Błąd: ${err.message}`),
  });

  // 3. Mutacja: ODDAJĘ (Release)
  const releaseMutation = useMutation({
    mutationFn: (shiftId: string) => releaseShift(shiftId, currentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      alert("Zmiana wystawiona na giełdę!");
    },
    onError: (err) => alert(`Błąd: ${err.message}`),
  });

  if (isLoading) return <div className="p-10 text-center">Ładowanie...</div>;
  if (error) return <div className="p-10 text-red-500">Błąd: {error.message}</div>;

  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Giełda Zmian</h1>
          <UserSwitcher currentUserId={currentUserId} onUserChange={handleUserChange} />
        </div>

        <div className="grid gap-4">
          {shifts?.map((shift: Shift) => {
            const isMyShift = shift.userId === currentUserId;
            const isAvailable = shift.isUpForGrabs;

            // Logika wyświetlania
            let actionLabel = "Zajęte";
            let onAction = () => { };
            let disabled = true;
            let statusBadge: "open" | "claimed" | "secondary" = "claimed";

            if (isMyShift) {
              if (isAvailable) {
                statusBadge = "secondary"; // Żółty/Szary
                actionLabel = "Czeka na chętnego...";
                disabled = true; // Na razie nie robimy "Wycofaj"
              } else {
                statusBadge = "claimed";
                actionLabel = "Oddaj na giełdę";
                onAction = () => releaseMutation.mutate(shift.id);
                disabled = false;
              }
            } else {
              // Cudza zmiana
              if (isAvailable) {
                statusBadge = "open";
                actionLabel = "Biorę to!";
                onAction = () => claimMutation.mutate(shift.id);
                disabled = false;
              } else {
                statusBadge = "claimed";
                actionLabel = "Zajęte przez kogoś";
                disabled = true;
              }
            }

            // Obsługa ładowania
            if (claimMutation.isPending || releaseMutation.isPending) {
              disabled = true;
            }

            const timeStr = new Date(shift.startTime).toLocaleString("pl-PL", {
              weekday: "short", hour: "2-digit", minute: "2-digit"
            }) + " - " + new Date(shift.endTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

            return (
              <ShiftCard
                key={shift.id}
                role={shift.roleName + (isMyShift ? " (TY)" : "")}
                time={timeStr}
                status={statusBadge as any}
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