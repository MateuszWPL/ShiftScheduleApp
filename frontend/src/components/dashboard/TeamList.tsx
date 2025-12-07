"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamMembers, User } from "@/lib/api";

interface Props {
  userId: string;
}

export function TeamList({ userId }: Props) {
  const { data: members, isLoading } = useQuery({
    queryKey: ["teamMembers", userId],
    queryFn: () => getTeamMembers(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-2">Zespół</h3>
        <p className="text-sm text-gray-500">Ładowanie...</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-2">Zespół</h3>
        <p className="text-sm text-gray-500">Brak członków zespołu</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="font-semibold mb-3">Zespół ({members.length})</h3>
      <div className="space-y-2">
        {members.map((member: User) => (
          <div key={member.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
            <div>
              <p className="text-sm font-medium">{member.name}</p>
              <p className="text-xs text-gray-500">{member.email}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 uppercase">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}