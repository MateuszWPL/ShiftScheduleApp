"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  API_URL,
  getMyProfile,
  getMyMembershipStatus,
  clearAuthTokenCache,
} from "@/lib/api";

export type GateStatus =
  | "loading"
  | "unauthenticated"
  | "syncing"
  | "unverified"
  | "pending"
  | "onboarding"
  | "ready";

export interface DashboardGateResult {
  status: GateStatus;
  dbUser: any;
  currentUser: any;
  membershipStatus: string | null;
  setDbUser: (u: any) => void;
  invalidateQueries: () => void;
}

export function useDashboardGate(): DashboardGateResult {
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [lastSyncedEmail, setLastSyncedEmail] = useState<string | null>(null);
  const [isSyncingUser, setIsSyncingUser] = useState(false);

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
    if (!session?.user?.email) return;
    const email = session.user.email;
    if (lastSyncedEmail === email && dbUser) return;
    if (isSyncingUser) return;

    setIsSyncingUser(true);
    const timeoutId = setTimeout(() => setIsSyncingUser(false), 10000);

    fetch(`${API_URL}/shifts/users/sync?email=${encodeURIComponent(email)}`)
      .then((res) => {
        if (res.status === 429) throw new Error("Too many requests");
        if (!res.ok) throw new Error(`Sync failed ${res.status}`);
        return res.json();
      })
      .then(async (user) => {
        clearTimeout(timeoutId);
        setDbUser(user);
        setLastSyncedEmail(email);
        try {
          const statusData = await getMyMembershipStatus();
          setMembershipStatus(statusData.status);
        } catch {
          setMembershipStatus(user.teamId ? "ACTIVE" : null);
        }
        queryClient.invalidateQueries({ queryKey: ["shifts"] });
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      })
      .catch(() => clearTimeout(timeoutId))
      .finally(() => setIsSyncingUser(false));
  }, [session?.user?.email, lastSyncedEmail, dbUser, isSyncingUser, queryClient]);

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: !!session && !!dbUser?.teamId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const currentUser = myProfile || dbUser;

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["shifts"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    queryClient.invalidateQueries({ queryKey: ["team-members"] });
  };

  if (sessionStatus === "loading") {
    return {
      status: "loading",
      dbUser: null,
      currentUser: null,
      membershipStatus: null,
      setDbUser,
      invalidateQueries,
    };
  }

  if (!session) {
    return {
      status: "unauthenticated",
      dbUser: null,
      currentUser: null,
      membershipStatus: null,
      setDbUser,
      invalidateQueries,
    };
  }

  if (isSyncingUser || (!dbUser && lastSyncedEmail !== session.user?.email)) {
    return {
      status: "syncing",
      dbUser,
      currentUser,
      membershipStatus,
      setDbUser,
      invalidateQueries,
    };
  }

  if (dbUser?.provider === "email" && !dbUser?.emailVerified) {
    return {
      status: "unverified",
      dbUser,
      currentUser,
      membershipStatus,
      setDbUser,
      invalidateQueries,
    };
  }

  const isPending = membershipStatus === "PENDING" || dbUser?.membershipStatus === "PENDING";
  if (dbUser && isPending) {
    return {
      status: "pending",
      dbUser,
      currentUser,
      membershipStatus,
      setDbUser,
      invalidateQueries,
    };
  }

  if (dbUser && !dbUser.teamId) {
    return {
      status: "onboarding",
      dbUser,
      currentUser,
      membershipStatus,
      setDbUser,
      invalidateQueries,
    };
  }

  return {
    status: "ready",
    dbUser,
    currentUser,
    membershipStatus,
    setDbUser,
    invalidateQueries,
  };
}
