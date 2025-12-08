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

// Helper function do pobierania JWT tokena
async function getAuthToken(): Promise<string | null> {
  // Sprawdź cache (token ważny 7 dni, ale odświeżamy co 6 dni)
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  try {
    const res = await fetch("/api/auth/token", {
      credentials: "include", // Ważne: wysyłamy cookies z sesją
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[AUTH] Error fetching token:", res.status, errorData);
      
      // Jeśli 401, to znaczy że nie ma sesji - użytkownik nie jest zalogowany
      if (res.status === 401) {
        console.warn("[AUTH] No session found - user not logged in");
      }
      
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
    }
    
    return token;
  } catch (error) {
    console.error("[AUTH] Error fetching auth token:", error);
    return null;
  }
}

// Helper function do wykonywania autentykowanych requestów
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    console.error("[API] No token available, request will fail");
    throw new Error("Brak autoryzacji. Zaloguj się ponownie.");
  }

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  console.log("[API] Making authenticated request to:", url);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok && response.status === 401) {
    console.error("[API] 401 Unauthorized - token may be invalid or expired");
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
  email: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  phoneNumber?: string | null;
  skills: string[]; // <--- Postgres zwraca to jako tablicę
}

export async function getUsers(): Promise<User[]> {
  const res = await authenticatedFetch(`${API_URL}/shifts/users/all`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania userów");
  }
  return res.json();
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