"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamMembers, User, PrivateUser, getAvatarUrl } from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";
import { Users, Phone, Mail, DollarSign, Clock, Edit } from "lucide-react";
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
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-slate-600" />
          <h1 className="text-3xl font-bold">Zespół</h1>
        </div>
        {members && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {members.length} {members.length === 1 ? "osoba" : "osób"}
          </Badge>
        )}
      </div>

      {!isAdmin && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <p className="text-blue-800">
            <strong>Uwaga:</strong> Tylko administratorzy mogą edytować dane pracowników.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members?.map((member: User | PrivateUser) => {
          const privateMember = member as PrivateUser;
          const isPrivateData = "hourlyRate" in member;

          return (
            <Card key={member.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar src={getAvatarUrl(member.avatarUrl) || undefined} name={member.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      {member.nickname && (
                        <span className="text-sm text-gray-500">({member.nickname})</span>
                      )}
                    </div>
                    <Badge
                      variant={member.role === "OWNER" ? "default" : member.role === "MANAGER" ? "secondary" : "outline"}
                      className="text-xs mt-1"
                    >
                      {member.role === "OWNER" ? "Właściciel" : member.role === "MANAGER" ? "Manager" : "Pracownik"}
                    </Badge>
                  </div>
                </div>
                {isAdmin && member.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(member as User)}
                    className="shrink-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {member.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {"phoneNumber" in member && member.phoneNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{member.phoneNumber}</span>
                  </div>
                )}
                {isPrivateData && isAdmin && (
                  <>
                    {privateMember.hourlyRate != null && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{privateMember.hourlyRate} PLN/h</span>
                      </div>
                    )}
                    {privateMember.maxHours != null && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{privateMember.maxHours} h/tydzień</span>
                      </div>
                    )}
                  </>
                )}
                {member.skills && member.skills.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
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
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Brak członków zespołu</p>
        </Card>
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
