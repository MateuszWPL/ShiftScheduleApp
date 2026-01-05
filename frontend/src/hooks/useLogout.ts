import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthTokenCache } from "@/lib/api";

export function useLogout() {
  const queryClient = useQueryClient();

  const logout = async () => {
    clearAuthTokenCache();
    queryClient.clear();
    await signOut({ redirect: false });
  };

  return logout;
}

