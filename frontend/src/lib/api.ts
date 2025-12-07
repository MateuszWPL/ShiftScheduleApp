const API_URL = "http://localhost:3001";

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  roleName: string;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED";
  isUpForGrabs: boolean;
  userId: string | null;
}

export async function getShifts(): Promise<Shift[]> {
  const res = await fetch(`${API_URL}/shifts`);
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