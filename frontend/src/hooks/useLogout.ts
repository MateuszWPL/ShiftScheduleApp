import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthTokenCache } from "@/lib/api";

export function useLogout() {
  const queryClient = useQueryClient();

  const logout = async () => {
    queryClient.cancelQueries();
    queryClient.removeQueries();
    queryClient.clear();
    clearAuthTokenCache();
    await signOut({ redirect: false });
    window.location.replace('/');
  };

  return logout;
}

