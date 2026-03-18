const KEY = "staffer_invite_code";
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function saveInviteCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ code, expiresAt: Date.now() + TTL_MS })
    );
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function readInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      clearInviteCode();
      return null;
    }
    return code as string;
  } catch {
    return null;
  }
}

export function clearInviteCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
