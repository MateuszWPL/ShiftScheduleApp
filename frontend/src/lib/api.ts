export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper function do budowania pełnego URL dla avatara
export function getAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl) return undefined;
  
  // Jeśli już jest pełny URL (http/https), zwróć jak jest
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // Jeśli jest względną ścieżką, dodaj API_URL
  if (avatarUrl.startsWith('/')) {
    return `${API_URL}${avatarUrl}`;
  }
  
  return avatarUrl;
}

/** Minimalny user w odpowiedzi z API (np. w assignment) */
export interface ShiftUser {
  id: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  userId: string | null;
  isUpForGrabs: boolean;
  user?: ShiftUser | null;
  shift?: Shift;
}

export interface Position {
  id: string;
  teamId: string;
  name: string;
  color: string;
  _count?: { employees: number; shifts: number };
}

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  roleName: string;
  positionId?: string | null;
  position?: Position | null;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED";
  teamId: string;
  assignments?: ShiftAssignment[];
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

export interface GetShiftsParams {
  from?: string; // ISO date
  to?: string;   // ISO date
}

export async function getShifts(params?: GetShiftsParams): Promise<Shift[]> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const q = search.toString();
  const url = q ? `${API_URL}/shifts?${q}` : `${API_URL}/shifts`;
  const res = await authenticatedFetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania zmian");
  }
  return res.json();
}

export async function getShift(shiftId: string): Promise<Shift> {
  const res = await authenticatedFetch(`${API_URL}/shifts/${shiftId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania zmiany");
  }
  return res.json();
}

export async function getMarketplace(): Promise<ShiftAssignment[]> {
  const res = await authenticatedFetch(`${API_URL}/shifts/marketplace`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania giełdy");
  }
  return res.json();
}

export async function claimAssignment(assignmentId: string): Promise<ShiftAssignment> {
  const res = await authenticatedFetch(`${API_URL}/shifts/assignments/${assignmentId}/claim`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd przejmowania pozycji");
  }
  return res.json();
}

export async function releaseAssignment(assignmentId: string): Promise<ShiftAssignment> {
  const res = await authenticatedFetch(`${API_URL}/shifts/assignments/${assignmentId}/release`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd oddawania pozycji");
  }
  return res.json();
}

export interface AddAssignmentInput {
  userId?: string | null;
  isUpForGrabs?: boolean;
}

export async function addAssignment(shiftId: string, data: AddAssignmentInput): Promise<ShiftAssignment> {
  const res = await authenticatedFetch(`${API_URL}/shifts/${shiftId}/assignments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd dodawania przypisania");
  }
  return res.json();
}

export async function updateAssignment(
  assignmentId: string,
  data: AddAssignmentInput
): Promise<ShiftAssignment> {
  const res = await authenticatedFetch(`${API_URL}/shifts/assignments/${assignmentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd edycji przypisania");
  }
  return res.json();
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_URL}/shifts/assignments/${assignmentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd usuwania przypisania");
  }
}

// --- Dostępność ---
export interface AvailabilitySlot {
  id: string;
  userId: string;
  teamId: string;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; nickname?: string | null };
}

export interface AvailabilitySlotInput {
  startDateTime: string;
  endDateTime: string;
}

export async function getMyAvailability(params?: { from?: string; to?: string }): Promise<AvailabilitySlot[]> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const q = search.toString();
  const url = q ? `${API_URL}/availability/me?${q}` : `${API_URL}/availability/me`;
  const res = await authenticatedFetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Błąd pobierania dostępności");
  }
  return res.json();
}

export async function getTeamAvailability(params: { from: string; to: string }): Promise<AvailabilitySlot[]> {
  const search = new URLSearchParams({ from: params.from, to: params.to });
  const res = await authenticatedFetch(`${API_URL}/availability/team?${search}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Błąd pobierania dostępności zespołu");
  }
  return res.json();
}

export async function createAvailabilitySlots(slots: AvailabilitySlotInput[]): Promise<AvailabilitySlot[]> {
  const res = await authenticatedFetch(`${API_URL}/availability`, {
    method: "POST",
    body: JSON.stringify({ slots }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Błąd dodawania dostępności");
  }
  return res.json();
}

export async function deleteAvailabilitySlot(slotId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_URL}/availability/slots/${slotId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Błąd usuwania slotu");
  }
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
  positions?: Position[];
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
  roleName?: string;
  positionId?: string;
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

export interface UpdateShiftInput {
  startTime?: string;
  endTime?: string;
  roleName?: string;
  positionId?: string;
  status?: "DRAFT" | "PUBLISHED" | "COMPLETED";
}

export async function updateShift(shiftId: string, data: UpdateShiftInput): Promise<Shift> {
  const res = await authenticatedFetch(`${API_URL}/shifts/${shiftId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd edycji zmiany");
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

export async function revokeAllSessions(): Promise<{ success: boolean; message: string }> {
  const res = await authenticatedFetch(`${API_URL}/auth/revoke-all`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd unieważniania sesji");
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

// --- Publish shifts ---
export interface PublishShiftsInput {
  shiftIds?: string[];
  from?: string;
  to?: string;
}

export interface PublishShiftsResult {
  published: number;
  warnings: string[];
}

export async function publishShifts(data: PublishShiftsInput): Promise<PublishShiftsResult> {
  const res = await authenticatedFetch(`${API_URL}/shifts/publish`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd publikacji grafiku");
  }
  return res.json();
}

// --- Summary ---
export interface SummaryEmployee {
  userId: string;
  name: string;
  hours: number;
  maxHours: number | null;
  warnings: string[];
}

export interface ScheduleSummary {
  from: string;
  to: string;
  employees: SummaryEmployee[];
}

export async function getScheduleSummary(params: { from: string; to: string }): Promise<ScheduleSummary> {
  const search = new URLSearchParams({ from: params.from, to: params.to });
  const res = await authenticatedFetch(`${API_URL}/shifts/summary?${search}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Błąd pobierania podsumowania");
  }
  return res.json();
}

// --- Copy week ---
export interface CopyWeekInput {
  sourceWeekStart: string;
  targetWeekStart: string;
  structureOnly?: boolean;
}

export interface CopyWeekPreviewItem {
  roleName: string;
  startTime: string;
  endTime: string;
  newStartTime: string;
  newEndTime: string;
  assignees: { userId: string; name: string }[];
}

export interface CopyWeekResult {
  copied: number;
  structureOnly: boolean;
}

export async function previewCopyWeek(data: CopyWeekInput): Promise<CopyWeekPreviewItem[]> {
  const res = await authenticatedFetch(`${API_URL}/shifts/copy-week/preview`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd podglądu kopiowania");
  }
  return res.json();
}

export async function copyWeek(data: CopyWeekInput): Promise<CopyWeekResult> {
  const res = await authenticatedFetch(`${API_URL}/shifts/copy-week`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd kopiowania grafiku");
  }
  return res.json();
}

// --- Validate assignment ---
export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export async function validateAssignment(
  shiftId: string,
  userId: string
): Promise<ValidationResult> {
  const res = await authenticatedFetch(
    `${API_URL}/shifts/${shiftId}/validate-assignment/${userId}`
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd walidacji");
  }
  return res.json();
}

// --- Delete shift ---
export async function deleteShift(shiftId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_URL}/shifts/${shiftId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd usuwania zmiany");
  }
}

// --- In-app notifications ---
export interface Notification {
  id: string;
  userId: string;
  teamId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  meta: string | null;
  createdAt: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await authenticatedFetch(`${API_URL}/notifications`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania powiadomień");
  }
  return res.json();
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await authenticatedFetch(`${API_URL}/notifications/unread-count`);
  if (!res.ok) return 0;
  return res.json();
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await authenticatedFetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authenticatedFetch(`${API_URL}/notifications/read-all`, {
    method: "POST",
  });
}

// --- Announcements ---
export interface AnnouncementAuthor {
  id: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
}

export interface Announcement {
  id: string;
  teamId: string;
  title: string;
  content: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  expiresAt: string | null;
  createdAt: string;
  author: AnnouncementAuthor;
  isRead: boolean;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  expiresAt?: string;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const res = await authenticatedFetch(`${API_URL}/announcements`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania ogłoszeń");
  }
  return res.json();
}

export async function createAnnouncement(data: CreateAnnouncementInput): Promise<Announcement> {
  const res = await authenticatedFetch(`${API_URL}/announcements`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd tworzenia ogłoszenia");
  }
  return res.json();
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_URL}/announcements/${announcementId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd usuwania ogłoszenia");
  }
}

export async function markAnnouncementRead(announcementId: string): Promise<void> {
  await authenticatedFetch(`${API_URL}/announcements/${announcementId}/read`, {
    method: "POST",
  });
}

// --- Team Settings ---
export interface TeamSettingsData {
  companyName: string | null;
  logoUrl: string | null;
  defaultOpenHour: number;
  defaultCloseHour: number;
  minShiftDurationMin: number;
  maxShiftDurationMin: number;
  notifyShiftAssigned: boolean;
  notifyShiftPublished: boolean;
  notifyMarketplace: boolean;
  notifyAnnouncements: boolean;
}

export interface TeamInfo {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface TeamSettingsResponse {
  team: TeamInfo;
  settings: TeamSettingsData;
}

export async function getTeamSettings(): Promise<TeamSettingsResponse> {
  const res = await authenticatedFetch(`${API_URL}/team-settings`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania ustawień");
  }
  return res.json();
}

export async function updateTeamSettings(data: Partial<TeamSettingsData>): Promise<TeamSettingsResponse> {
  const res = await authenticatedFetch(`${API_URL}/team-settings`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd aktualizacji ustawień");
  }
  return res.json();
}

export async function updateTeamName(name: string): Promise<TeamSettingsResponse> {
  const res = await authenticatedFetch(`${API_URL}/team-settings/team-name`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd aktualizacji nazwy");
  }
  return res.json();
}

export async function regenerateInviteCode(): Promise<{ inviteCode: string }> {
  const res = await authenticatedFetch(`${API_URL}/team-settings/regenerate-invite`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd regeneracji kodu");
  }
  return res.json();
}

// --- Positions (Stanowiska) ---
export async function getPositions(): Promise<Position[]> {
  const res = await authenticatedFetch(`${API_URL}/positions`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd pobierania stanowisk");
  }
  return res.json();
}

export async function createPosition(data: { name: string; color?: string }): Promise<Position> {
  const res = await authenticatedFetch(`${API_URL}/positions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd tworzenia stanowiska");
  }
  return res.json();
}

export async function updatePosition(id: string, data: { name?: string; color?: string }): Promise<Position> {
  const res = await authenticatedFetch(`${API_URL}/positions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd edycji stanowiska");
  }
  return res.json();
}

export async function deletePosition(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_URL}/positions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd usuwania stanowiska");
  }
}

export async function assignPositionsToEmployee(userId: string, positionIds: string[]): Promise<void> {
  const res = await authenticatedFetch(`${API_URL}/positions/employees/${userId}`, {
    method: "POST",
    body: JSON.stringify({ positionIds }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Błąd przypisywania stanowisk");
  }
}
