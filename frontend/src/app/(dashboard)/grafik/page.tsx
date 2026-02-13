"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimAssignment } from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { ScheduleGrid } from "@/components/dashboard/ScheduleGrid";
import { CreateShiftDialog } from "@/components/dashboard/CreateShiftDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ShiftAssignment } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { getMarketplace } from "@/lib/api";

function GiełdaSection({
  currentUserId,
  currentUserRole,
  claimMutation,
}: {
  currentUserId: string;
  currentUserRole: string;
  claimMutation: { mutate: (id: string) => void; isPending: boolean };
}) {
  const { data: marketplace = [] } = useQuery({
    queryKey: ["marketplace"],
    queryFn: getMarketplace,
  });

  if (marketplace.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h3 className="font-semibold text-slate-800 mb-2">Giełda zmian (do przejęcia)</h3>
      <ul className="space-y-2">
        {marketplace.map((a: ShiftAssignment) => {
          const shift = a.shift;
          if (!shift) return null;
          const who = a.user ? a.user.nickname || a.user.name : "Ktoś";
          const timeStr = `${new Date(shift.startTime).toLocaleDateString("pl-PL")} ${new Date(shift.startTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}–${new Date(shift.endTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
          const isMine = a.userId === currentUserId;
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0 text-sm"
            >
              <span className="text-slate-700">
                <strong>{shift.roleName}</strong> {timeStr}
                {who && <span className="text-slate-500"> — oddaje: {who}</span>}
              </span>
              {!isMine && currentUserRole === "EMPLOYEE" && (
                <Button
                  size="sm"
                  onClick={() => claimMutation.mutate(a.id)}
                  disabled={claimMutation.isPending}
                >
                  Biorę
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function GrafikPage() {
  const { dbUser } = useDashboardUser();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => new Date());
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);

  const claimMutation = useMutation({
    mutationFn: claimAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Pozycja przejęta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Grafik</h1>
        {isAdmin && (
          <Button onClick={() => setIsCreateShiftOpen(true)}>+ Dodaj zmianę</Button>
        )}
      </div>

      <ScheduleGrid
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        currentUserId={dbUser?.id ?? ""}
        currentUserRole={dbUser?.role ?? "EMPLOYEE"}
      />

      <GiełdaSection
        currentUserId={dbUser?.id ?? ""}
        currentUserRole={dbUser?.role ?? "EMPLOYEE"}
        claimMutation={claimMutation}
      />

      <CreateShiftDialog
        isOpen={isCreateShiftOpen}
        onClose={() => setIsCreateShiftOpen(false)}
      />
    </div>
  );
}
