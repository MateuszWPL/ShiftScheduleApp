"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PendingList } from "@/components/dashboard/PendingList";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import {
  getShifts,
  getNotifications,
  getMyAvailability,
  getAnnouncements,
  markAnnouncementRead,
  getTeamMembers,
  getTeamSettings,
  type Shift,
  type Notification,
  type Announcement,
} from "@/lib/api";
import {
  getOnboardingWizardSkipped,
  getOnboardingWizardDone,
} from "@/lib/onboarding-storage";
import {
  Calendar,
  Clock,
  Bell,
  ClipboardCheck,
  ChevronRight,
  Copy,
  Check,
  Users,
  Megaphone,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function getWeekMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseShiftTime(isoStr: string): string {
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "??";
}

function formatDayShort(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  const days = Math.floor(hrs / 24);
  return `${days}d temu`;
}

export default function PulpitPage() {
  const { dbUser, currentUser, setDbUser } = useDashboardUser();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const monday = useMemo(() => getWeekMonday(), []);
  const weekEnd = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    return d;
  }, [monday]);

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", monday.toISOString(), weekEnd.toISOString()],
    queryFn: () => getShifts({ from: monday.toISOString(), to: weekEnd.toISOString() }),
  });

  const { data: teamSettings } = useQuery({
    queryKey: ["team-settings"],
    queryFn: getTeamSettings,
    enabled: !!dbUser && (dbUser?.role === "OWNER" || dbUser?.role === "MANAGER"),
    retry: false,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    enabled: !!dbUser && (dbUser?.role === "OWNER" || dbUser?.role === "MANAGER"),
    retry: false,
  });

  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";
  const isFirstRun =
    isAdmin &&
    !getOnboardingWizardSkipped() &&
    !getOnboardingWizardDone() &&
    (teamMembers.length <= 1 || shifts.length === 0);

  useEffect(() => {
    if (isFirstRun && teamMembers.length >= 0 && shifts.length >= 0) {
      setWizardOpen(true);
    }
  }, [isFirstRun, teamMembers.length, shifts.length]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["availability-me", monday.toISOString(), weekEnd.toISOString()],
    queryFn: () => getMyAvailability({ from: monday.toISOString(), to: weekEnd.toISOString() }),
    enabled: dbUser?.role === "EMPLOYEE",
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: getAnnouncements,
  });

  const queryClient = useQueryClient();
  const readAnnouncementMutation = useMutation({
    mutationFn: markAnnouncementRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  if (!dbUser) return null;

  const displayUser = currentUser || dbUser;

  // My shifts this week
  const myShifts = useMemo(() => {
    return shifts
      .filter((s: Shift) =>
        s.assignments?.some((a) => a.userId === dbUser.id)
      )
      .sort((a: Shift, b: Shift) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [shifts, dbUser.id]);

  // Total hours this week
  const totalHours = useMemo(() => {
    let mins = 0;
    for (const s of myShifts) {
      const start = new Date(s.startTime).getTime();
      const end = new Date(s.endTime).getTime();
      mins += (end - start) / 60000;
    }
    return Math.round(mins / 60 * 10) / 10;
  }, [myShifts]);

  // Upcoming shifts (today/tomorrow)
  const upcomingShifts = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(0, 0, 0, 0);
    return myShifts.filter((s: Shift) => {
      const st = new Date(s.startTime);
      return st >= now || (st.toDateString() === now.toDateString());
    }).slice(0, 3);
  }, [myShifts]);

  const recentNotifications = notifications.slice(0, 5);

  const handleCopyCode = () => {
    if (dbUser?.team?.inviteCode) {
      navigator.clipboard.writeText(dbUser.team.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl w-full min-w-0">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-dark truncate">
          Cześć, {displayUser?.name?.split(" ")[0] || "Użytkowniku"}
        </h1>
        <p className="text-brand-dark-muted text-xs sm:text-sm mt-0.5 line-clamp-2">
          {new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-brand-warm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
              <Calendar className="h-4 w-4 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-dark">{myShifts.length}</p>
          <p className="text-xs text-brand-dark-muted">Zmian w tym tygodniu</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-warm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue-muted flex items-center justify-center">
              <Clock className="h-4 w-4 text-brand-blue" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-dark">{totalHours}h</p>
          <p className="text-xs text-brand-dark-muted">Godzin w tym tygodniu</p>
        </div>

        {dbUser.role === "EMPLOYEE" && (
          <div className="bg-white rounded-xl border border-brand-warm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{availability.length}</p>
            <p className="text-xs text-brand-dark-muted">Dostępności zgłoszone</p>
          </div>
        )}

        {isAdmin && (
          <div className="bg-white rounded-xl border border-brand-warm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {shifts.filter((s: Shift) => s.status === "DRAFT").length}
            </p>
            <p className="text-xs text-brand-dark-muted">Zmian w szkicu</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-brand-warm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-warm flex items-center justify-center">
              <Bell className="h-4 w-4 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-dark">
            {notifications.filter((n: Notification) => !n.read).length}
          </p>
          <p className="text-xs text-brand-dark-muted">Nieprzeczytanych</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Upcoming shifts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upcoming shifts */}
          <div className="bg-white rounded-xl border border-brand-warm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-warm">
              <h2 className="font-semibold text-brand-dark text-sm">Najbliższe zmiany</h2>
              <Link href="/grafik" className="text-xs text-brand hover:text-brand-light font-medium flex items-center gap-0.5">
                Zobacz grafik <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {upcomingShifts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-brand-dark-soft" />
                <p className="text-sm text-brand-dark-muted">Brak nadchodzących zmian</p>
                <Link href="/grafik" className="text-xs text-brand hover:underline mt-1 inline-block">
                  Przejdź do grafiku
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-brand-warm">
                {upcomingShifts.map((shift: Shift) => {
                  const isToday = new Date(shift.startTime).toDateString() === new Date().toDateString();
                  return (
                    <div key={shift.id} className="flex items-center gap-4 px-5 py-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isToday ? "bg-brand text-white" : "bg-brand-blue-muted text-brand-blue"
                      }`}>
                        {isToday ? "DZIŚ" : new Date(shift.startTime).toLocaleDateString("pl-PL", { weekday: "short" }).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-dark">{shift.roleName}</p>
                        <p className="text-xs text-brand-dark-muted">
                          {formatDayShort(shift.startTime)} &middot; {parseShiftTime(shift.startTime)}–{parseShiftTime(shift.endTime)}
                        </p>
                      </div>
                      {shift.status === "DRAFT" && (
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Szkic
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-warm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-brand-warm">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-brand" />
                  <h2 className="font-semibold text-brand-dark text-sm">Ogłoszenia</h2>
                  {announcements.filter((a: Announcement) => !a.isRead).length > 0 && (
                    <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {announcements.filter((a: Announcement) => !a.isRead).length}
                    </span>
                  )}
                </div>
                <Link href="/announcements" className="text-xs text-brand hover:text-brand-light font-medium flex items-center gap-0.5">
                  Wszystkie <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-brand-warm">
                {announcements.slice(0, 3).map((a: Announcement) => {
                  const priorityIcon = a.priority === "URGENT"
                    ? <AlertTriangle className="h-3 w-3 text-red-500" />
                    : a.priority === "IMPORTANT"
                    ? <AlertCircle className="h-3 w-3 text-amber-500" />
                    : null;

                  return (
                    <div
                      key={a.id}
                      className={`px-5 py-3 flex items-start gap-3 ${!a.isRead ? "bg-brand-muted/20" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        a.priority === "URGENT" ? "bg-red-50" :
                        a.priority === "IMPORTANT" ? "bg-amber-50" : "bg-brand-blue-muted"
                      }`}>
                        {a.priority === "URGENT" ? <AlertTriangle className="h-4 w-4 text-red-500" /> :
                         a.priority === "IMPORTANT" ? <AlertCircle className="h-4 w-4 text-amber-500" /> :
                         <Megaphone className="h-4 w-4 text-brand-blue" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm truncate ${!a.isRead ? "font-semibold text-brand-dark" : "font-medium text-brand-dark-muted"}`}>
                            {a.title}
                          </p>
                          {!a.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-brand-dark-muted mt-0.5 line-clamp-1">{a.content}</p>
                        <p className="text-[10px] text-brand-dark-soft mt-1">{timeAgo(a.createdAt)} · {a.author.nickname || a.author.name}</p>
                      </div>
                      {!a.isRead && (
                        <button
                          onClick={() => readAnnouncementMutation.mutate(a.id)}
                          className="p-1 rounded-lg text-brand-dark-soft hover:text-brand-blue hover:bg-brand-blue-muted transition-colors flex-shrink-0"
                          title="Oznacz jako przeczytane"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending members (admin only) */}
          {isAdmin && <PendingList currentUserRole={dbUser?.role} />}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick profile card */}
          <div className="bg-white rounded-xl border border-brand-warm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-muted flex items-center justify-center text-brand font-bold text-sm">
                {(displayUser?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-dark text-sm truncate">{displayUser?.name}</p>
                <p className="text-xs text-brand-dark-muted">
                  {dbUser.role === "OWNER" ? "Właściciel" : dbUser.role === "MANAGER" ? "Menedżer" : "Pracownik"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-brand-dark-muted hover:text-brand"
                onClick={() => setIsProfileOpen(true)}
              >
                Edytuj
              </Button>
            </div>
            {dbUser?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {dbUser.skills.map((s: string) => (
                  <span key={s} className="text-[10px] bg-brand-blue-muted text-brand-blue px-2 py-0.5 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Invite code (owner only) */}
          {dbUser?.role === "OWNER" && dbUser?.team?.inviteCode && (
            <div className="bg-white rounded-xl border border-brand-warm p-5">
              <p className="text-[10px] font-semibold text-brand-dark-soft uppercase tracking-wider mb-2">
                Kod zaproszenia
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <code className="flex-1 min-w-0 text-sm sm:text-lg font-mono tracking-widest text-brand-dark font-bold select-all break-all truncate">
                  {dbUser.team.inviteCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg hover:bg-brand-muted text-brand-dark-muted hover:text-brand transition-colors"
                  title="Kopiuj kod"
                >
                  {codeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-brand-dark-soft mt-2">
                Udostępnij ten kod pracownikom, aby dołączyli do zespołu.
              </p>
            </div>
          )}

          {/* Recent notifications */}
          <div className="bg-white rounded-xl border border-brand-warm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-warm">
              <h2 className="font-semibold text-brand-dark text-sm">Powiadomienia</h2>
            </div>
            {recentNotifications.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <Bell className="h-6 w-6 mx-auto mb-1.5 text-brand-dark-soft" />
                <p className="text-xs text-brand-dark-soft">Brak powiadomień</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-warm">
                {recentNotifications.map((n: Notification) => (
                  <div
                    key={n.id}
                    className={`px-5 py-2.5 ${!n.read ? "bg-brand-muted/30" : ""}`}
                  >
                    <p className={`text-xs ${!n.read ? "font-medium text-brand-dark" : "text-brand-dark-muted"}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-brand-dark-soft mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileDialog
        user={dbUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={(updatedUser) => {
          setDbUser({
            ...updatedUser,
            team: dbUser?.team,
            teamId: dbUser?.teamId,
            role: dbUser?.role,
            skills: dbUser?.skills,
            avatarUrl: dbUser?.avatarUrl,
          });
        }}
      />

      <OnboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        inviteCode={teamSettings?.team?.inviteCode ?? dbUser?.team?.inviteCode ?? null}
        onAddFirstShift={() => router.push("/grafik?addShift=1")}
      />
    </div>
  );
}
