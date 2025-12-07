"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, Shift } from "@/lib/api";
import { ShiftCard } from "@/components/ShiftCard"; // Upewnij się, że import działa

// Hardcoded ID Managera (tego samego używaliśmy w backendzie)
const CURRENT_USER_ID = "e8ee0d69-e52b-40b1-87b0-5d8e310f57b1";

export default function Home() {
  const queryClient = useQueryClient();

  // 1. Pobieranie
  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ["shifts"],
    queryFn: getShifts,
  });

  // 2. Kliknięcie
  const mutation = useMutation({
    mutationFn: (shiftId: string) => claimShift(shiftId, CURRENT_USER_ID),
    onSuccess: () => {
      // Automatyczne odświeżenie listy po sukcesie
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      alert("Sukces! Zmiana została przejęta.");
    },
    onError: (err) => {
      alert(`Błąd: ${err.message}`);
    },
  });

  if (isLoading) return <div className="p-10 text-center">Ładowanie grafiku...</div>;
  if (error) return <div className="p-10 text-red-500">Błąd połączenia z backendem: {error.message}</div>;

  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Giełda Zmian</h1>

        <div className="grid gap-4">
          {shifts?.map((shift: Shift) => {
            // Logika wyświetlania statusu
            const isAvailable = shift.isUpForGrabs;

            const start = new Date(shift.startTime).toLocaleString("pl-PL", {
              weekday: "long", hour: "2-digit", minute: "2-digit"
            });
            const end = new Date(shift.endTime).toLocaleTimeString("pl-PL", {
              hour: "2-digit", minute: "2-digit"
            });

            return (
              <ShiftCard
                key={shift.id}
                role={shift.roleName}
                time={`${start} - ${end}`}
                status={isAvailable ? "open" : "claimed"}
                actionLabel={isAvailable ? "Biorę to!" : "Zajęte"}
                // Blokujemy przycisk jeśli zajęte lub trwa procesowanie
                actionDisabled={!isAvailable || mutation.isPending}
                onAction={() => mutation.mutate(shift.id)}
              />
            );
          })}

          {shifts?.length === 0 && (
            <p className="text-center text-gray-500">Brak zmian w grafiku.</p>
          )}
        </div>
      </div>
    </main>
  );
}