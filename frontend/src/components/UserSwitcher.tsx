"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getUsers, PublicUser, PrivateUser } from "@/lib/api";

interface Props {
  currentUserId: string;
  onUserChange: (userId: string) => void;
}

export function UserSwitcher({ currentUserId, onUserChange }: Props) {
  const { data: session } = useSession();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: !!session,
    retry: false,
  });

  if (!users) return <div>Ładowanie userów...</div>;

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border">
      <span className="text-sm font-medium text-brand-dark-muted">Grasz jako:</span>
      <select
        className="p-1 border rounded text-sm font-bold"
        value={currentUserId}
        onChange={(e) => onUserChange(e.target.value)}
      >
        {users.map((u: PublicUser | PrivateUser) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </div>
  );
}