export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  roleName: string;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED";
  isUpForGrabs: boolean;
  userId: string | null;
}

// Cache tokena (żeby nie pobierać za każdym razem)
let tokenCache: { token: string; expiresAt: number } | null = null;

// Funkcja do czyszczenia cache tokena (np. podczas wylogowania)
export function clearAuthTokenCache() {
  tokenCache = null;
}

// Helper function do pobierania JWT tokena
async function getAuthToken(): Promise<string | null> {
  // Sprawdź cache (token ważny 7 dni, ale odświeżamy co 6 dni)
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    console.log("[AUTH] Using cached token");
    return tokenCache.token;
  }

  console.log("[AUTH] Fetching new token from /api/auth/token");
  try {
    const res = await fetch("/api/auth/token", {
      credentials: "include", // Ważne: wysyłamy cookies z sesją
    });
    
    console.log("[AUTH] Token response status:", res.status);
    
    if (!res.ok) {
      // Jeśli 401, to znaczy że nie ma sesji - użytkownik nie jest zalogowany
      // Nie logujemy tego jako błąd, bo to normalna sytuacja podczas wylogowania
      if (res.status === 401) {
        console.log("[AUTH] 401 - no session, clearing cache");
        // Wyczyść cache tokena
        tokenCache = null;
        return null;
      }
      
      // Dla innych błędów logujemy
      const errorData = await res.json().catch(() => ({}));
      console.error("[AUTH] Error fetching token:", res.status, errorData);
      
      return null;
    }
    
    const data = await res.json();
    const token = data.token || null;
    
    if (token) {
      // Cache tokena (ważny 7 dni, ale odświeżamy po 6 dniach)
      tokenCache = {
        token,
        expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 dni
      };
      console.log("[AUTH] Token cached until:", new Date(tokenCache.expiresAt).toISOString());
    }
    
    return token;
  } catch (error) {
    console.error("[AUTH] Error fetching auth token:", error);
    return null;
  }
}

// Helper function do wykonywania autentykowanych requestów
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  console.log("[AUTH] authenticatedFetch called for:", url, "method:", options.method || "GET");
  const token = await getAuthToken();
  
  if (!token) {
    console.log("[AUTH] No token available, returning 401");
    // Zwróć odpowiedź z błędem zamiast rzucać wyjątek
    // To pozwala komponentom obsłużyć błąd 401 gracefully
    return new Response(
      JSON.stringify({ message: "Brak autoryzacji. Zaloguj się ponownie." }),
      {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Nie loguj requestów do /api/auth/token podczas wylogowania (to jest normalne)
  if (!isTokenRequest || response.status !== 401) {
    console.log("[AUTH] Response status for", url, ":", response.status);
  }

  // Nie logujemy 401 jako błąd - to normalne podczas wylogowania
  if (!response.ok && response.status === 401) {
    if (!isTokenRequest) {
      console.log("[AUTH] 401 response, clearing token cache");
    }
    // Wyczyść cache tokena przy 401
    tokenCache = null;
  }

  if (response.status === 429) {
    console.error("[AUTH] 429 Too Many Requests for:", url);
  }

  return response;
}

export async function getShifts(): Promise<Shift[]> {
  // userId jest teraz z tokena, nie z query - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania zmian");
  }
  return res.json();
}

export async function claimShift(shiftId: string): Promise<Shift> {
  // userId jest teraz z tokena, nie z body - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/${shiftId}/claim`, {
    method: "POST",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd przejmowania zmiany");
  }
  return res.json();
}

export async function releaseShift(shiftId: string): Promise<Shift> {
  // userId jest teraz z tokena, nie z body - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/${shiftId}/release`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd oddawania zmiany");
  }
  return res.json();
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  phoneNumber?: string | null;
  skills: string[];
  avatarUrl?: string | null;
  status?: "ACTIVE" | "UNCLAIMED";
  hourlyRate?: number | null;
  maxHours?: number | null;
}

export interface PublicUser {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  skills: string[];
  avatarUrl?: string | null;
  status?: "ACTIVE" | "UNCLAIMED";
}

export interface PrivateUser extends PublicUser {
  email: string | null;
  hourlyRate: number | null;
  phoneNumber: string | null;
  maxHours: number | null;
}

export async function createTeam(name: string) {
  // userId jest teraz z tokena - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/teams`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd tworzenia firmy");
  }
  return res.json();
}

export async function joinTeam(code: string) {
  // userId jest teraz z tokena - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/join`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd dołączania (sprawdź kod)");
  }
  return res.json();
}

export async function getTeamMembers(): Promise<User[]> {
  // userId jest teraz z tokena - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/team/members`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania zespołu");
  }
  return res.json();
}

export async function updateUserProfile(name: string, phoneNumber: string) {
  // userId jest teraz z tokena - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/users/me`, {
    method: "PATCH",
    body: JSON.stringify({ name, phoneNumber }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd aktualizacji profilu");
  }
  return res.json();
}

export async function updateUserAvatar(avatarUrl: string) {
  const res = await authenticatedFetch(`${API_URL}/users/me`, {
    method: "PATCH",
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd aktualizacji avatara");
  }
  return res.json();
}

export async function updateMyProfile(phoneNumber?: string, avatarUrl?: string) {
  const res = await authenticatedFetch(`${API_URL}/users/me`, {
    method: "PATCH",
    body: JSON.stringify({ phoneNumber, avatarUrl }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd aktualizacji profilu");
  }
  return res.json();
}

export async function getMyProfile(): Promise<User | PublicUser | PrivateUser> {
  const res = await authenticatedFetch(`${API_URL}/users/me`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania profilu");
  }
  return res.json();
}

export async function getUsers(): Promise<(PublicUser | PrivateUser)[]> {
  const res = await authenticatedFetch(`${API_URL}/users`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania użytkowników");
  }
  return res.json();
}

export interface CreateShadowProfileDto {
  name: string;
  hourlyRate: number;
  maxHours?: number;
  phoneNumber?: string;
}

export async function createShadowProfile(data: CreateShadowProfileDto) {
  const res = await authenticatedFetch(`${API_URL}/users/shadow-profile`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd tworzenia profilu pracownika");
  }
  return res.json();
}

export async function updateEmployeeSkills(targetId: string, skills: string[]) {
  // requesterId jest teraz z tokena - BEZPIECZNIE
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/members/${targetId}`, {
    method: "PATCH",
    body: JSON.stringify({ skills }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd edycji pracownika");
  }
  return res.json();
}

export interface CreateShiftInput {
  startTime: string; // ISO string
  endTime: string; // ISO string
  roleName: string;
  status?: "DRAFT" | "PUBLISHED" | "COMPLETED";
}

export async function createShift(data: CreateShiftInput): Promise<Shift> {
  const res = await authenticatedFetch(`${API_URL}/shifts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd tworzenia zmiany");
  }
  return res.json();
}

// Sprawdź status membership użytkownika
export async function getMyMembershipStatus(): Promise<{ status: string }> {
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/my-membership`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania statusu członkostwa");
  }
  const data = await res.json();
  return data; // Backend zwraca { status: "PENDING" | "ACTIVE" | ... }
}

// --- MEMBERSHIP / PENDING ---

export type MembershipStatus = "PENDING" | "ACTIVE" | "REJECTED" | "LEFT";

export interface PendingMember {
  id: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  requestedAt: string;
}

export async function getPendingMembers(): Promise<PendingMember[]> {
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/pending`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania oczekujących");
  }
  return res.json();
}

export async function approvePending(membershipId: string) {
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/pending/${membershipId}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Nie udało się zatwierdzić");
  }
  return res.json();
}

export async function rejectPending(membershipId: string) {
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/pending/${membershipId}/reject`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Nie udało się odrzucić");
  }
  return res.json();
}

// --- PASSWORD RESET ---

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_URL}/auth/request-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd wysyłania prośby o reset hasła");
  }
  return res.json();
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd resetu hasła");
  }
  return res.json();
}