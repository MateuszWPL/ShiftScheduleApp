"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getTeamMembers, User } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2, Phone } from "lucide-react";
import { useState } from "react";
import { ManageEmployeeDialog } from "./ManageEmployeeDialog";

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export function TeamList({ currentUserId, currentUserRole }: Props) {
  const { data: session } = useSession();
  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members", currentUserId],
    queryFn: () => getTeamMembers(),
    enabled: !!session && !!currentUserId,
    retry: false,
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (isLoading) return <div className="p-4 text-sm text-brand-dark-muted">Ładowanie zespołu...</div>;

  const isBoss = currentUserRole === 'ADMIN';

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-brand-dark">Twój Zespół</h3>
          <Badge variant="outline">{members?.length || 0} osób</Badge>
        </div>

        <div className="space-y-3">
          {members?.map((member: User) => (
            <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-brand-warm-light transition">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-brand-dark">{member.name}</p>
                  <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {member.role}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-brand-dark-soft">{member.email}</p>
                  {member.phoneNumber && (
                    <span className="text-[10px] text-brand-dark-muted flex items-center gap-1 bg-brand-warm-light px-1.5 rounded">
                      <Phone className="h-3 w-3" /> {member.phoneNumber}
                    </span>
                  )}
                </div>

                {member.role === 'EMPLOYEE' && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {member.skills && member.skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] bg-brand-blue-muted text-brand-blue px-1.5 py-0.5 rounded border border-brand-blue/30">
                        {skill}
                      </span>
                    ))}
                    {(!member.skills || member.skills.length === 0) && (
                      <span className="text-[10px] text-brand-dark-soft italic">Brak tagów</span>
                    )}
                  </div>
                )}
              </div>

              {isBoss && member.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(member)}
                >
                  <Settings2 className="h-4 w-4 text-brand-dark-muted" />
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