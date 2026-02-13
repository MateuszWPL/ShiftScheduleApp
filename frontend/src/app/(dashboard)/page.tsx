"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TeamList } from "@/components/dashboard/TeamList";
import { PendingList } from "@/components/dashboard/PendingList";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";

export default function PulpitPage() {
  const { dbUser, currentUser, setDbUser } = useDashboardUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!dbUser) return null;

  const displayUser = currentUser || dbUser;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-bold text-xl text-slate-900">{displayUser?.name}</h2>
              <p className="text-sm text-gray-500">
                {"phoneNumber" in (displayUser || {}) ? (displayUser as any)?.phoneNumber : dbUser?.phoneNumber || "Dodaj telefon..."}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {dbUser?.skills?.map((s: string) => (
                  <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(true)}>
              Edytuj
            </Button>
          </div>
          {dbUser?.role === "OWNER" && dbUser?.team?.inviteCode && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                Kod Zespołu
              </p>
              <p className="text-2xl font-mono tracking-widest text-blue-900 select-all cursor-pointer">
                {dbUser.team.inviteCode}
              </p>
            </div>
          )}
        </div>
        <TeamList currentUserId={dbUser?.id} currentUserRole={dbUser?.role} />
        <PendingList currentUserRole={dbUser?.role} />
      </div>
      <div className="lg:col-span-2 flex items-center justify-center text-slate-500 bg-white rounded-lg border border-slate-200 min-h-[200px]">
        <p className="text-center">
          Grafik, dostępność i panel menedżera znajdziesz w menu po lewej.
        </p>
      </div>
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
    </div>
  );
}
