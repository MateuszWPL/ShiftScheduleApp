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

let tokenCache: { token: string; expiresAt: number } | null = null;

export function clearAuthTokenCache() {
  tokenCache = null;
}

async function getAuthToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  try {
    const res = await fetch("/api/auth/token", {
      credentials: "include",
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        tokenCache = null;
      }
      return null;
    }
    
    const data = await res.json();
    const token = data.token || null;
    
    if (token) {
      tokenCache = {
        token,
        expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
      };
    }
    
    return token;
  } catch (error) {
    return null;
  }
}


async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {

  const token = await getAuthToken();
  
  if (!token) {
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

  if (!response.ok && response.status === 401) {
    tokenCache = null;
  }

  return response;
}

async function authenticatedFetchFormData(url: string, formData: FormData): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    return new Response(
      JSON.stringify({ message: "Brak autoryzacji. Zaloguj się ponownie." }),
      {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok && response.status === 401) {
    tokenCache = null;
  }

  return response;
}

export async function getShifts(): Promise<Shift[]> {
  const res = await authenticatedFetch(`${API_URL}/shifts`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania zmian");
  }
  return res.json();
}

export async function claimShift(shiftId: string): Promise<Shift> {
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
  nickname?: string | null;
}

export interface PublicUser {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  skills: string[];
  avatarUrl?: string | null;
  status?: "ACTIVE" | "UNCLAIMED";
  nickname?: string | null;
}

export interface PrivateUser extends PublicUser {
  email: string | null;
  hourlyRate: number | null;
  phoneNumber: string | null;
  maxHours: number | null;
  notes?: string | null;
}

export async function createTeam(name: string) {
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
  const res = await authenticatedFetch(`${API_URL}/shifts/team/members`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania zespołu");
  }
  return res.json();
}

export async function updateUserProfile(name: string, phoneNumber: string) {
  const res = await authenticatedFetch(`${API_URL}/users/me`, {
    method: "PATCH",
    body: JSON.stringify({ name, phoneNumber }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd aktualizacji profilu");
  }
  return res.json();
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await authenticatedFetchFormData(`${API_URL}/users/me/avatar`, formData);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd wgrywania zdjęcia");
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

export interface UpdateEmployeeData {
  name?: string;
  nickname?: string | null;
  hourlyRate?: number | null;
  maxHours?: number | null;
  skills?: string[];
  notes?: string | null;
}

export async function updateEmployee(targetId: string, data: UpdateEmployeeData) {
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/members/${targetId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd edycji pracownika");
  }
  return res.json();
}

// Backward compatibility - można użyć tej funkcji jeśli potrzebujemy tylko skills
export async function updateEmployeeSkills(targetId: string, skills: string[]) {
  return updateEmployee(targetId, { skills });
}

export interface CreateShiftInput {
  startTime: string;
  endTime: string;
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

export async function getMyMembershipStatus(): Promise<{ status: string }> {
  const res = await authenticatedFetch(`${API_URL}/shifts/teams/my-membership`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania statusu członkostwa");
  }
  const data = await res.json();
  return data;
}

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
