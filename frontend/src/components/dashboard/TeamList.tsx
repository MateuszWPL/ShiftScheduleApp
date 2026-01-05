"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamMembers, User } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2, Phone } from "lucide-react"; // Dodaj import Phone
import { useState } from "react";
import { ManageEmployeeDialog } from "./ManageEmployeeDialog";

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export function TeamList({ currentUserId, currentUserRole }: Props) {
  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members", currentUserId],
    queryFn: () => getTeamMembers(),
    enabled: !!currentUserId,
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (isLoading) return <div className="p-4 text-sm text-gray-500">Ładowanie zespołu...</div>;

  const isBoss = currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Twój Zespół</h3>
          <Badge variant="outline">{members?.length || 0} osób</Badge>
        </div>

        <div className="space-y-3">
          {members?.map((member: User) => (
            <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{member.name}</p>
                  <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {member.role}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">{member.email}</p>
                  {member.phoneNumber && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-100 px-1.5 rounded">
                      <Phone className="h-3 w-3" /> {member.phoneNumber}
                    </span>
                  )}
                </div>

                {member.role === 'EMPLOYEE' && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {member.skills && member.skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                        {skill}
                      </span>
                    ))}
                    {(!member.skills || member.skills.length === 0) && (
                      <span className="text-[10px] text-gray-300 italic">Brak tagów</span>
                    )}
                  </div>
                )}
              </div>

              {/* Przycisk akcji tylko dla Szefa (i nie dla samego siebie) */}
              {isBoss && member.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(member)}
                >
                  <Settings2 className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {editingUser && (
        <ManageEmployeeDialog
          managerId={currentUserId}
          targetUser={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
}