import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthTokenCache, setLoggingOut } from "@/lib/api";

export function useLogout() {
  const queryClient = useQueryClient();

  const logout = async () => {
    // Ustawiamy flagę wylogowywania PRZED anulowaniem zapytań
    // żeby zapobiec nowym zapytaniom podczas wylogowywania
    setLoggingOut(true);
    // Anulujemy wszystkie zapytania React Query
    queryClient.cancelQueries();
    queryClient.removeQueries();
    queryClient.clear();
    // Czyścimy cache tokena
    clearAuthTokenCache();
    // Dajemy chwilę czasu na anulowanie wszystkich zapytań
    // żeby uniknąć błędów 401 w konsoli
    await new Promise(resolve => setTimeout(resolve, 100));
    // Wylogowujemy użytkownika
    await signOut({ redirect: false });
    // Używamy replace zamiast href żeby nie zostawić historii
    // i upewnić się że przekierowanie działa poprawnie
    window.location.replace('/');
  };

  return logout;
}

