"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getPendingMembers, approvePending, rejectPending, PendingMember } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  currentUserRole: string;
}

export function PendingList({ currentUserRole }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: pending, isLoading } = useQuery({
    queryKey: ["pending-members"],
    queryFn: () => getPendingMembers(),
    enabled: !!session && (currentUserRole === "OWNER" || currentUserRole === "MANAGER"),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: (membershipId: string) => approvePending(membershipId),
    onSuccess: (_, membershipId) => {
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Pracownik zaakceptowany!", {
        description: "Pracownik otrzymał dostęp do zespołu.",
      });
    },
    onError: (err: Error) => {
      toast.error("Błąd akceptacji", {
        description: err.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (membershipId: string) => rejectPending(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
      toast.success("Prośba odrzucona", {
        description: "Pracownik został powiadomiony o odrzuceniu.",
      });
    },
    onError: (err: Error) => {
      toast.error("Błąd odrzucenia", {
        description: err.message,
      });
    },
  });

  if (currentUserRole !== "OWNER" && currentUserRole !== "MANAGER") return null;
  if (isLoading) return <div className="p-4 text-sm text-brand-dark-muted">Ładowanie oczekujących...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-brand-dark">Oczekujące zgłoszenia</h3>
        <span className="text-xs text-brand-dark-soft">{pending?.length || 0}</span>
      </div>

      {(!pending || pending.length === 0) && (
        <p className="text-sm text-brand-dark-muted">Brak oczekujących zgłoszeń.</p>
      )}

      <div className="space-y-3">
        {pending?.map((item: PendingMember) => (
          <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <p className="text-sm font-bold text-brand-dark">{item.user.name || "Nowy użytkownik"}</p>
              <p className="text-xs text-brand-dark-muted">{item.user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectMutation.mutate(item.id)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                Odrzuć
              </Button>
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(item.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Zatwierdź
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}