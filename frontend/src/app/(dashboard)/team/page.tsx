"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamMembers, User, PrivateUser, getAvatarUrl } from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";
import { Users, Phone, Mail, DollarSign, Clock, Edit, Info } from "lucide-react";
import { ManageEmployeeDialog } from "@/components/dashboard/ManageEmployeeDialog";

export default function TeamPage() {
  const { dbUser, currentUser } = useDashboardUser();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled: !!dbUser,
    retry: false,
  });

  const user = currentUser || dbUser;
  const isAdmin = user && (user.role === "OWNER" || user.role === "MANAGER");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-muted flex items-center justify-center">
            <Users className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Zespół</h1>
            <p className="text-xs text-brand-dark/40">Zarządzaj członkami zespołu</p>
          </div>
        </div>
        {members && (
          <span className="text-sm font-medium text-brand-dark/50 bg-brand-warm-light/50 px-3 py-1.5 rounded-full">
            {members.length} {members.length === 1 ? "osoba" : members.length < 5 ? "osoby" : "osób"}
          </span>
        )}
      </div>

      {/* Hint for non-admins */}
      {!isAdmin && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-blue-muted/30 border border-brand-blue/10 text-sm">
          <Info className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
          <p className="text-brand-dark/50 text-xs">
            Tylko administratorzy mogą edytować dane pracowników.
          </p>
        </div>
      )}

      {/* Hint for admins */}
      {isAdmin && members && members.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-muted/30 border border-brand/10 text-sm">
          <Info className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
          <p className="text-brand-dark/50 text-xs">
            Kliknij ikonę <Edit className="h-3 w-3 inline text-brand-dark/40" /> na karcie pracownika, aby edytować jego dane, rolę lub stawkę godzinową.
          </p>
        </div>
      )}

      {/* Member grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members?.map((member: User | PrivateUser) => {
          const privateMember = member as PrivateUser;
          const isPrivateData = "hourlyRate" in member;

          const roleBadge = {
            OWNER: { label: "Właściciel", bg: "bg-brand-muted text-brand" },
            MANAGER: { label: "Menedżer", bg: "bg-brand-blue-muted text-brand-blue" },
            EMPLOYEE: { label: "Pracownik", bg: "bg-brand-warm-light text-brand-dark/60" },
          }[member.role] || { label: member.role, bg: "bg-gray-100 text-gray-600" };

          return (
            <Card key={member.id} className="p-5 hover:shadow-md transition-shadow border-brand-warm/40 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar src={getAvatarUrl(member.avatarUrl) || undefined} name={member.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-brand-dark">{member.name}</h3>
                      {member.nickname && (
                        <span className="text-xs text-brand-dark/40">({member.nickname})</span>
                      )}
                    </div>
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
                {isAdmin && member.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(member as User)}
                    className="shrink-0 text-brand-dark/30 hover:text-brand"
                    title="Edytuj pracownika"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {member.email && (
                  <div className="flex items-center gap-2 text-brand-dark/50">
                    <Mail className="h-3.5 w-3.5 text-brand-dark/25" />
                    <span className="truncate text-xs">{member.email}</span>
                  </div>
                )}
                {"phoneNumber" in member && member.phoneNumber && (
                  <div className="flex items-center gap-2 text-brand-dark/50">
                    <Phone className="h-3.5 w-3.5 text-brand-dark/25" />
                    <span className="text-xs">{member.phoneNumber}</span>
                  </div>
                )}
                {isPrivateData && isAdmin && (
                  <>
                    {privateMember.hourlyRate != null && (
                      <div className="flex items-center gap-2 text-brand-dark/50">
                        <DollarSign className="h-3.5 w-3.5 text-brand-dark/25" />
                        <span className="text-xs">{privateMember.hourlyRate} PLN/h</span>
                      </div>
                    )}
                    {privateMember.maxHours != null && (
                      <div className="flex items-center gap-2 text-brand-dark/50">
                        <Clock className="h-3.5 w-3.5 text-brand-dark/25" />
                        <span className="text-xs">{privateMember.maxHours} h/tydzień</span>
                      </div>
                    )}
                  </>
                )}
                {(member as User).positions && (member as User).positions!.length > 0 && (
                  <div className="pt-2 border-t border-brand-warm/20">
                    <div className="flex flex-wrap gap-1">
                      {(member as User).positions!.map((pos) => (
                        <span
                          key={pos.id}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: pos.color }}
                        >
                          {pos.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {member.skills && member.skills.length > 0 && (
                  <div className={`${(member as User).positions?.length ? "pt-1" : "pt-2 border-t border-brand-warm/20"}`}>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-brand-blue-muted/50 text-brand-blue px-2 py-0.5 rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {members && members.length === 0 && (
        <div className="bg-white border border-brand-warm/40 rounded-xl p-12 text-center">
          <Users className="h-10 w-10 text-brand-dark/15 mx-auto mb-3" />
          <p className="text-sm font-medium text-brand-dark/50">Brak członków zespołu</p>
          <p className="text-xs text-brand-dark/30 mt-1">Zaproś pracowników, aby dołączyli.</p>
        </div>
      )}

      {editingUser && (
        <ManageEmployeeDialog
          managerId={user?.id || ""}
          targetUser={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
