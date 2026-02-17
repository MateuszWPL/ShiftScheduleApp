"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PendingList } from "@/components/dashboard/PendingList";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import {
  getShifts,
  getNotifications,
  getMyAvailability,
  type Shift,
  type Notification,
} from "@/lib/api";
import {
  Calendar,
  Clock,
  Bell,
  ClipboardCheck,
  ChevronRight,
  Copy,
  Check,
  Users,
} from "lucide-react";
import Link from "next/link";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

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

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["availability-me", monday.toISOString(), weekEnd.toISOString()],
    queryFn: () => getMyAvailability({ from: monday.toISOString(), to: weekEnd.toISOString() }),
    enabled: dbUser?.role === "EMPLOYEE",
  });

  if (!dbUser) return null;

  const displayUser = currentUser || dbUser;
  const isAdmin = dbUser.role === "OWNER" || dbUser.role === "MANAGER";

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
    <div className="space-y-6 max-w-5xl">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">
          Cześć, {displayUser?.name?.split(" ")[0] || "Użytkowniku"}
        </h1>
        <p className="text-brand-dark/50 text-sm mt-0.5">
          {new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-brand-warm/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
              <Calendar className="h-4 w-4 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-dark">{myShifts.length}</p>
          <p className="text-xs text-brand-dark/40">Zmian w tym tygodniu</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-warm/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue-muted flex items-center justify-center">
              <Clock className="h-4 w-4 text-brand-blue" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-dark">{totalHours}h</p>
          <p className="text-xs text-brand-dark/40">Godzin w tym tygodniu</p>
        </div>

        {dbUser.role === "EMPLOYEE" && (
          <div className="bg-white rounded-xl border border-brand-warm/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{availability.length}</p>
            <p className="text-xs text-brand-dark/40">Dostępności zgłoszone</p>
          </div>
        )}

        {isAdmin && (
          <div className="bg-white rounded-xl border border-brand-warm/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {shifts.filter((s: Shift) => s.status === "DRAFT").length}
            </p>
            <p className="text-xs text-brand-dark/40">Zmian w szkicu</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-brand-warm/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-warm flex items-center justify-center">
              <Bell className="h-4 w-4 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-dark">
            {notifications.filter((n: Notification) => !n.read).length}
          </p>
          <p className="text-xs text-brand-dark/40">Nieprzeczytanych</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Upcoming shifts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upcoming shifts */}
          <div className="bg-white rounded-xl border border-brand-warm/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-warm/30">
              <h2 className="font-semibold text-brand-dark text-sm">Najbliższe zmiany</h2>
              <Link href="/grafik" className="text-xs text-brand hover:text-brand-light font-medium flex items-center gap-0.5">
                Zobacz grafik <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {upcomingShifts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-brand-dark/20" />
                <p className="text-sm text-brand-dark/40">Brak nadchodzących zmian</p>
                <Link href="/grafik" className="text-xs text-brand hover:underline mt-1 inline-block">
                  Przejdź do grafiku
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-brand-warm/20">
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
                        <p className="text-xs text-brand-dark/40">
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

          {/* Pending members (admin only) */}
          {isAdmin && <PendingList currentUserRole={dbUser?.role} />}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick profile card */}
          <div className="bg-white rounded-xl border border-brand-warm/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-muted flex items-center justify-center text-brand font-bold text-sm">
                {(displayUser?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-dark text-sm truncate">{displayUser?.name}</p>
                <p className="text-xs text-brand-dark/40">
                  {dbUser.role === "OWNER" ? "Właściciel" : dbUser.role === "MANAGER" ? "Menedżer" : "Pracownik"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-brand-dark/50 hover:text-brand"
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
            <div className="bg-white rounded-xl border border-brand-warm/50 p-5">
              <p className="text-[10px] font-semibold text-brand-dark/30 uppercase tracking-wider mb-2">
                Kod zaproszenia
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono tracking-widest text-brand-dark font-bold select-all">
                  {dbUser.team.inviteCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg hover:bg-brand-muted text-brand-dark/40 hover:text-brand transition-colors"
                  title="Kopiuj kod"
                >
                  {codeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-brand-dark/30 mt-2">
                Udostępnij ten kod pracownikom, aby dołączyli do zespołu.
              </p>
            </div>
          )}

          {/* Recent notifications */}
          <div className="bg-white rounded-xl border border-brand-warm/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-warm/30">
              <h2 className="font-semibold text-brand-dark text-sm">Powiadomienia</h2>
            </div>
            {recentNotifications.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <Bell className="h-6 w-6 mx-auto mb-1.5 text-brand-dark/15" />
                <p className="text-xs text-brand-dark/30">Brak powiadomień</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-warm/20">
                {recentNotifications.map((n: Notification) => (
                  <div
                    key={n.id}
                    className={`px-5 py-2.5 ${!n.read ? "bg-brand-muted/30" : ""}`}
                  >
                    <p className={`text-xs ${!n.read ? "font-medium text-brand-dark" : "text-brand-dark/60"}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-brand-dark/30 mt-0.5">{timeAgo(n.createdAt)}</p>
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
    </div>
  );
}
