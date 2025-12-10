"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShifts, claimShift, releaseShift, Shift, API_URL } from "@/lib/api";
import { ShiftCard } from "@/components/ShiftCard";
import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { TeamList } from "@/components/dashboard/TeamList";
import { DashboardLayout } from "@/components/layout/DashboardLayout"; // NOWY LAYOUT
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { CreateShiftDialog } from "@/components/dashboard/CreateShiftDialog";
import { Chrome } from "lucide-react";
import { PendingList } from "@/components/dashboard/PendingList";
import { PendingView } from "@/components/onboarding/PendingView";
import { getMyMembershipStatus } from "@/lib/api";
import { LoginPage } from "@/components/auth/LoginPage";
import { UnverifiedView } from "@/components/auth/UnverifiedView";

export default function Home() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isSyncingUser, setIsSyncingUser] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);

  // Sync User i sprawdź membership status
  useEffect(() => {
    if (session?.user?.email) {
      const { email, name } = session.user;
      setIsSyncingUser(true);
      fetch(`${API_URL}/shifts/users/sync?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || "")}`)
        .then(res => res.json())
        .then(async (user) => {
          setDbUser(user);
          // Sprawdź membership status jeśli user ma teamId
          if (user.teamId) {
            try {
              const statusData = await getMyMembershipStatus();
              // Backend zwraca { status: "PENDING" | "ACTIVE" | ... }
              const status = statusData.status || "ACTIVE";
              setMembershipStatus(status);
            } catch (err) {
              // Jeśli błąd, zakładamy ACTIVE (stary user bez membership = ACTIVE)
              setMembershipStatus("ACTIVE");
            }
          }
          queryClient.invalidateQueries({ queryKey: ["shifts"] });
        })
        .finally(() => setIsSyncingUser(false));
    }
  }, [session, queryClient]);

  // Pobieranie zmian
  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts", dbUser?.id],
    queryFn: () => getShifts(), // userId jest teraz z tokena - BEZPIECZNIE
    enabled: !!dbUser?.teamId,
  });

  // Mutacje
  const claimMutation = useMutation({
    mutationFn: (shiftId: string) => claimShift(shiftId), // userId jest teraz z tokena - BEZPIECZNIE
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const releaseMutation = useMutation({
    mutationFn: (shiftId: string) => releaseShift(shiftId), // userId jest teraz z tokena - BEZPIECZNIE
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  // --- WIDOKI ---

  if (!session) {
    return <LoginPage />;
  }

  // Unikamy mignięcia dashboardu zanim zsynchronizujemy użytkownika
  if (isSyncingUser || !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full mx-auto" />
          <p className="text-sm text-gray-600">Ładujemy Twoje konto...</p>
        </div>
      </div>
    );
  }

  // Sprawdź czy użytkownik jest zweryfikowany (tylko dla email+hasło)
  // Google OAuth użytkownicy są automatycznie zweryfikowani
  if (dbUser && dbUser.provider === "email" && !dbUser.emailVerified) {
    return (
      <UnverifiedView
        email={dbUser.email}
        userName={dbUser.name || "Użytkownik"}
      />
    );
  }

  if (dbUser && !dbUser.teamId) {
    return (
      <OnboardingView
        userId={dbUser.id}
        userName={dbUser.name}
        onSuccess={(user) => {
          setDbUser(user);
          // Jeśli user dołączył i ma status PENDING, ustaw flagę
          if (user.membershipStatus === "PENDING") {
            setMembershipStatus("PENDING");
          }
        }}
        onLogout={() => signOut()}
      />
    );
  }

  // Jeśli user ma teamId, ale status PENDING - pokaż ekran oczekiwania
  // Sprawdzamy zarówno membershipStatus state jak i dbUser.membershipStatus
  const isPending = membershipStatus === "PENDING" || dbUser?.membershipStatus === "PENDING";
  
  if (dbUser && dbUser.teamId && isPending) {
    return (
      <PendingView
        userName={dbUser.name || "Użytkownik"}
        onLogout={() => signOut()}
      />
    );
  }

  // --- NOWY DASHBOARD Z SIDEBAREM ---
  return (
    <DashboardLayout userRole={dbUser?.role} onLogout={() => signOut()}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* KOLUMNA LEWA: KOD + ZESPÓŁ */}
        <div className="space-y-6">

          {/* Karta: Mój Profil */}
          <div className="bg-white p-5 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-xl text-slate-900">{dbUser?.name}</h2>
                <p className="text-sm text-gray-500">{dbUser?.phoneNumber || "Dodaj telefon..."}</p>
                {/* Moje skille */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {dbUser?.skills?.map((s: string) => (
                    <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(true)}>Edytuj</Button>
            </div>

            {dbUser?.role === 'OWNER' && dbUser?.team?.inviteCode && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Kod Zespołu</p>
                <p className="text-2xl font-mono tracking-widest text-blue-900 select-all cursor-pointer">
                  {dbUser.team.inviteCode}
                </p>
              </div>
            )}
          </div>

          {/* Lista Zespołu (z nową funkcją edycji) */}
          <TeamList currentUserId={dbUser?.id} currentUserRole={dbUser?.role} />
          <PendingList currentUserRole={dbUser?.role} />
        </div>

        {/* KOLUMNA PRAWA: GRAFIK (Szersza) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Aktualny Grafik</h2>
            {(dbUser?.role === 'OWNER' || dbUser?.role === 'MANAGER') && (
              <Button onClick={() => setIsCreateShiftOpen(true)}>+ Dodaj Zmianę</Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading && <p>Ładowanie...</p>}
            {shifts?.map((shift: Shift) => {
              // LOGIKA UI KARTY (Bez zmian)
              const isMyShift = shift.userId === dbUser?.id;
              const isAvailable = shift.isUpForGrabs;
              const timeStr = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                  actionLabel = "Oddaj";
                  onAction = () => releaseMutation.mutate(shift.id);
                  disabled = false;
                }
              } else {
                if (isAvailable) {
                  statusBadge = "open";
                  actionLabel = "Biorę!";
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
                  role={shift.roleName} // Tu można dodać (TY) w UI ShiftCard
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

      {/* MODALE */}
      {dbUser && (
        <>
          <EditProfileDialog
            user={dbUser}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
          <CreateShiftDialog
            isOpen={isCreateShiftOpen}
            onClose={() => setIsCreateShiftOpen(false)}
          />
        </>
      )}
    </DashboardLayout>
  );
}