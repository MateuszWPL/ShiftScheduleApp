"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, getAvatarUrl, getMyProfile, getMarketplace, claimAssignment } from "@/lib/api";
import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { TeamList } from "@/components/dashboard/TeamList";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScheduleGrid } from "@/components/dashboard/ScheduleGrid";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { CreateShiftDialog } from "@/components/dashboard/CreateShiftDialog";
import { PendingList } from "@/components/dashboard/PendingList";
import { PendingView } from "@/components/onboarding/PendingView";
import { getMyMembershipStatus, clearAuthTokenCache } from "@/lib/api";
import { LoginPage } from "@/components/auth/LoginPage";
import { UnverifiedView } from "@/components/auth/UnverifiedView";
import { Navbar } from "@/components/layout/Navbar";
import { useLogout } from "@/hooks/useLogout";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ShiftAssignment } from "@/lib/api";

function GiełdaSection({
  currentUserId,
  claimMutation,
}: {
  currentUserId: string;
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
              {!isMine && (
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

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset" | undefined>(undefined);
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isSyncingUser, setIsSyncingUser] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [lastSyncedEmail, setLastSyncedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setDbUser(null);
      setMembershipStatus(null);
      setLastSyncedEmail(null);
      clearAuthTokenCache();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      queryClient.clear();
    }
  }, [session, queryClient]);

  useEffect(() => {
    if (session?.user?.email) {
      const { email } = session.user;
      
      // Jeśli użytkownik jest już zsynchronizowany, nie wywołuj sync ponownie
      // Sync jest potrzebny tylko przy pierwszym logowaniu
      if (lastSyncedEmail === email && dbUser) {
        return;
      }

      if (isSyncingUser) {
        return;
      }

      setIsSyncingUser(true);
      
      const timeoutId = setTimeout(() => {
        setIsSyncingUser(false);
      }, 10000);
      
      // Sync tylko email - nie wysyłamy name, bo backend nie powinien nadpisywać ręcznie zmienionej nazwy
      fetch(`${API_URL}/shifts/users/sync?email=${encodeURIComponent(email)}`)
        .then(res => {
          if (res.status === 429) {
            throw new Error("Too many requests - please wait a moment");
          }
          if (!res.ok) {
            throw new Error(`Sync failed with status ${res.status}`);
          }
          return res.json();
        })
        .then(async (user) => {
          clearTimeout(timeoutId);
          setDbUser(user);
          setLastSyncedEmail(email);
          
          try {
            const statusData = await getMyMembershipStatus();
            setMembershipStatus(statusData.status);
          } catch (err) {
            if (user.teamId) {
              setMembershipStatus("ACTIVE");
            } else {
              setMembershipStatus(null);
            }
          }
          queryClient.invalidateQueries({ queryKey: ["shifts"] });
          // Po sync, pobierz najnowsze dane z profilu (ale nie nadpisuj jeśli użytkownik zmienił dane)
          queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.message.includes("429") || err.message.includes("Too many requests")) {
            setTimeout(() => {
              setLastSyncedEmail(null);
            }, 5000);
          }
        })
        .finally(() => {
          setIsSyncingUser(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, lastSyncedEmail]);

  // Pobierz dane użytkownika z React Query (synchronizacja z profile page)
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: !!session && !!dbUser?.teamId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Użyj myProfile jeśli jest dostępny, w przeciwnym razie dbUser
  // myProfile ma priorytet bo zawiera najnowsze dane z profilu
  const currentUser = myProfile || dbUser;

  const [weekStart, setWeekStart] = useState(() => new Date());

  const claimFromMarketplaceMutation = useMutation({
    mutationFn: claimAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      toast.success("Pozycja przejęta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Jeśli sesja się jeszcze ładuje, pokaż loading zamiast strony logowania
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full mx-auto" />
          <p className="text-sm text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar
          onLoginClick={() => setAuthMode("login")}
          onRegisterClick={() => setAuthMode("register")}
        />
        <LoginPage 
          initialMode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    );
  }

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

  if (dbUser && dbUser.provider === "email" && !dbUser.emailVerified) {
    return (
      <UnverifiedView
        email={dbUser.email}
        userName={dbUser.name || "Użytkownik"}
      />
    );
  }

  const isPending = membershipStatus === "PENDING" || dbUser?.membershipStatus === "PENDING";
  
  if (dbUser && isPending) {
    return (
      <PendingView
        userName={dbUser.name || "Użytkownik"}
        onLogout={logout}
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
          if (user.membershipStatus === "PENDING") {
            setMembershipStatus("PENDING");
          }
        }}
        onLogout={logout}
      />
    );
  }

  return (
      <DashboardLayout
        userRole={currentUser?.role || dbUser?.role}
        userName={currentUser?.name || dbUser?.name}
        userAvatar={getAvatarUrl(currentUser?.avatarUrl || dbUser?.avatarUrl) || null}
        onLogout={logout}
      >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-xl text-slate-900">{currentUser?.name || dbUser?.name}</h2>
                <p className="text-sm text-gray-500">{"phoneNumber" in (currentUser || {}) ? (currentUser as any)?.phoneNumber : dbUser?.phoneNumber || "Dodaj telefon..."}</p>
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

          <TeamList currentUserId={dbUser?.id} currentUserRole={dbUser?.role} />
          <PendingList currentUserRole={dbUser?.role} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Grafik (osoba × dzień)</h2>
            {(dbUser?.role === "OWNER" || dbUser?.role === "MANAGER") && (
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
            claimMutation={claimFromMarketplaceMutation}
          />
        </div>
      </div>

      {dbUser && (
        <>
          <EditProfileDialog
            user={dbUser}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onUpdate={(updatedUser) => {
              setDbUser({
                ...updatedUser,
                team: dbUser?.team,
                teamId: dbUser?.teamId,
                role: dbUser?.role,
                skills: dbUser?.skills,
                avatarUrl: dbUser?.avatarUrl,
              });
            }}
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