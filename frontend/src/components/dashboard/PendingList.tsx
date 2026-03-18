"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getPendingMembers, approvePending, rejectPending, getPlanStatus, PendingMember } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

interface Props {
  currentUserRole: string;
}

export function PendingList({ currentUserRole }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "MANAGER";
  const isOwner = currentUserRole === "OWNER";

  const { data: pending, isLoading } = useQuery({
    queryKey: ["pending-members"],
    queryFn: () => getPendingMembers(),
    enabled: !!session && isAdmin,
    retry: false,
  });

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
    enabled: !!session && isAdmin,
    staleTime: 30_000,
  });

  const atLimit =
    planStatus?.memberLimit != null &&
    planStatus.memberCount >= planStatus.memberLimit;

  const handleApproveAttempt = (item: PendingMember) => {
    if (atLimit) {
      const limit = planStatus!.memberLimit!;
      const planNames: Record<string, string> = {
        free: "Darmowy",
        starter: "Starter+",
        business: "Business+",
      };
      const planLabel = planNames[planStatus!.planId] ?? planStatus!.planId;
      toast.error("Osiągnięto limit pracowników", {
        description: `Plan ${planLabel} pozwala na maksymalnie ${limit} ${
          limit === 1 ? "pracownika" : limit < 5 ? "pracowników" : "pracowników"
        }. Ulepsz plan, aby zatwierdzić ${item.user.name || "nowego pracownika"}.`,
        action: isOwner
          ? {
              label: "Ulepsz plan",
              onClick: () => {
                window.location.href = paths.billing;
              },
            }
          : undefined,
        duration: 8000,
        icon: <Crown className="h-4 w-4 text-brand" />,
      });
      return;
    }
    approveMutation.mutate(item.id);
  };

  const approveMutation = useMutation({
    mutationFn: (membershipId: string) => approvePending(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["plan-status"] });
      toast.success("Pracownik zaakceptowany!", {
        description: "Pracownik otrzymał dostęp do zespołu.",
      });
    },
    onError: (err: Error) => {
      toast.error("Błąd akceptacji", {
        description: err.message,
        action: isOwner && err.message.toLowerCase().includes("limit")
          ? { label: "Ulepsz plan", onClick: () => { window.location.href = paths.billing; } }
          : undefined,
        duration: 7000,
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
      toast.error("Błąd odrzucenia", { description: err.message });
    },
  });

  if (!isAdmin) return null;
  if (isLoading) return <div className="p-4 text-sm text-brand-dark-muted">Ładowanie oczekujących...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-brand-dark">Oczekujące zgłoszenia</h3>
        <span className="text-xs text-brand-dark-soft">{pending?.length || 0}</span>
      </div>

      {/* Limit warning banner */}
      {atLimit && pending && pending.length > 0 && (
        <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-warning-muted border border-warning/30 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-brand-dark">
              Osiągnięto limit {planStatus!.memberLimit} pracowników.
            </span>{" "}
            <span className="text-brand-dark-muted">
              Nie możesz zatwierdzić nowych zgłoszeń.
            </span>{" "}
            {isOwner && (
              <Link href={paths.billing} className="inline-flex items-center gap-0.5 font-semibold text-brand hover:underline">
                <Crown className="h-3 w-3" />
                Ulepsz plan
              </Link>
            )}
          </div>
        </div>
      )}

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
                onClick={() => handleApproveAttempt(item)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={atLimit ? "opacity-50" : ""}
                title={atLimit ? "Osiągnięto limit pracowników" : undefined}
              >
                {atLimit ? <Crown className="h-3.5 w-3.5 mr-1" /> : null}
                Zatwierdź
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}