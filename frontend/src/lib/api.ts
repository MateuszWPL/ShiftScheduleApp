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

export async function getShifts(userId: string): Promise<Shift[]> {
  if (!userId) return [];
  // Przekazujemy userId w query stringu
  const res = await fetch(`${API_URL}/shifts?userId=${userId}`);
  if (!res.ok) throw new Error("Błąd pobierania zmian");
  return res.json();
}

export async function claimShift(shiftId: string, userId: string): Promise<Shift> {
  const res = await fetch(`${API_URL}/shifts/${shiftId}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd przejmowania zmiany");
  }
  return res.json();
}

export async function releaseShift(shiftId: string, userId: string): Promise<Shift> {
  const res = await fetch(`${API_URL}/shifts/${shiftId}/release`, {
    method: "PATCH", // Używamy PATCH, bo to częściowa zmiana
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
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
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/shifts/users/all`);
  if (!res.ok) throw new Error("Błąd pobierania userów");
  return res.json();
}

export async function createTeam(userId: string, name: string) {
  const res = await fetch(`${API_URL}/shifts/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name }),
  });
  
  if (!res.ok) throw new Error("Błąd tworzenia firmy");
  return res.json();
}

export async function joinTeam(userId: string, code: string) {
  const res = await fetch(`${API_URL}/shifts/teams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, code }),
  });
  if (!res.ok) throw new Error("Błąd dołączania (sprawdź kod)");
  return res.json();
}

export async function getTeamMembers(userId: string): Promise<User[]> {
  const res = await fetch(`${API_URL}/shifts/team/members?userId=${userId}`);
  if (!res.ok) throw new Error("Błąd pobierania zespołu");
  return res.json();
}