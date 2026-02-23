"use client";

import { usePathname } from "next/navigation";
import { AppTour } from "@/components/onboarding/AppTour";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  LogOut,
  User,
  Megaphone,
  BarChart3,
  FileDown,
  PieChart,
  Copy,
  Crown,
  Settings,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  userAvatar?: string | null;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  show?: boolean;
  premium?: boolean;
  tourId?: string;
}

function NavLink({ href, label, icon, active, premium, tourId }: NavItem & { active: boolean; tourId?: string }) {
  return (
    <Link
      href={href}
      data-tour={tourId}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-brand/10 text-brand"
          : "text-brand-dark-muted hover:text-brand-dark hover:bg-brand-warm-light"
      }`}
    >
      <span className={active ? "text-brand" : "text-brand-dark-soft"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {premium && (
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-brand bg-brand-muted px-1.5 py-0.5 rounded-full">
          <Crown className="h-2.5 w-2.5" />
          PRO
        </span>
      )}
    </Link>
  );
}

export function DashboardLayout({ children, userRole, userName, userAvatar, onLogout }: Props) {
  const pathname = usePathname();
  const roleLabel = userRole === "OWNER" ? "Właściciel" : userRole === "MANAGER" ? "Menedżer" : "Pracownik";
  const isAdmin = userRole === "OWNER" || userRole === "MANAGER";

  const mainNav: NavItem[] = [
    { href: "/", label: "Pulpit", icon: <LayoutDashboard className="h-4 w-4" />, tourId: "nav-pulpit" },
    { href: "/grafik", label: "Grafik", icon: <Calendar className="h-4 w-4" />, tourId: "nav-grafik" },
    { href: "/podsumowanie", label: "Podsumowanie", icon: <BarChart3 className="h-4 w-4" />, tourId: "nav-podsumowanie" },
    { href: "/dostepnosc", label: "Dostępność", icon: <CalendarCheck className="h-4 w-4" />, show: userRole === "EMPLOYEE" },
  ];

  const teamNav: NavItem[] = [
    { href: "/team", label: "Pracownicy", icon: <Users className="h-4 w-4" />, tourId: "nav-team" },
    { href: "/announcements", label: "Ogłoszenia", icon: <Megaphone className="h-4 w-4" /> },
  ];

  const premiumNav: NavItem[] = [
    { href: "/reports", label: "Raporty", icon: <PieChart className="h-4 w-4" />, premium: true },
    { href: "/export", label: "Eksport", icon: <FileDown className="h-4 w-4" />, premium: true },
    { href: "/templates", label: "Szablony", icon: <Copy className="h-4 w-4" />, premium: true, show: isAdmin },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderSection = (title: string, items: NavItem[]) => {
    const visible = items.filter((i) => i.show !== false);
    if (visible.length === 0) return null;
    return (
      <div>
        <p className="text-[10px] font-semibold text-brand-dark-muted uppercase tracking-wider px-3 mb-1.5">{title}</p>
        <div className="space-y-0.5">
          {visible.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-brand-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-white border-r border-brand-warm flex flex-col hidden md:flex shadow-sm">
        {/* Logo area */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-brand-dark tracking-tight">ShiftApp</h1>
              <p className="text-[10px] text-brand-dark-muted font-medium uppercase tracking-wider">{roleLabel}</p>
            </div>
          </div>
          <NotificationBell align="left" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
          {renderSection("Menu", mainNav)}
          {renderSection("Zespół", teamNav)}
          {renderSection("Premium", premiumNav)}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-brand-warm p-3 space-y-1">
          <NavLink href="/profile" label="Mój Profil" icon={<User className="h-4 w-4" />} active={isActive("/profile")} tourId="nav-profile" />
          {isAdmin && (
            <NavLink href="/settings" label="Ustawienia" icon={<Settings className="h-4 w-4" />} active={isActive("/settings")} />
          )}
        </div>

        {/* User card */}
        {userName && (
          <div className="px-4 py-3 border-t border-brand-warm flex items-center gap-3">
            <Avatar src={userAvatar} name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-dark truncate">{userName}</p>
              <p className="text-[10px] text-brand-dark-muted">{roleLabel}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-brand-dark-soft hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-brand-warm px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-brand-dark text-sm">ShiftApp</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={onLogout} className="p-2 rounded-lg text-brand-dark-muted hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-warm z-40 flex justify-around px-2 py-1.5 safe-area-pb shadow-[0_-2px_10px_rgba(11,8,41,0.06)]">
          {[
            { href: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Pulpit", tourId: "nav-pulpit" },
            { href: "/grafik", icon: <Calendar className="h-5 w-5" />, label: "Grafik", tourId: "nav-grafik" },
            { href: "/podsumowanie", icon: <BarChart3 className="h-5 w-5" />, label: "Podsumowanie", tourId: "nav-podsumowanie" },
            ...(userRole === "EMPLOYEE" ? [{ href: "/dostepnosc", icon: <CalendarCheck className="h-5 w-5" />, label: "Dostępność", tourId: undefined }] : []),
            { href: "/team", icon: <Users className="h-5 w-5" />, label: "Zespół", tourId: "nav-team" },
            { href: "/profile", icon: <User className="h-5 w-5" />, label: "Profil", tourId: "nav-profile" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              {...(item.tourId ? { "data-tour": item.tourId as string } : {})}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive(item.href)
                  ? "text-brand"
                  : "text-brand-dark-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex-1 p-5 md:p-8 pb-20 md:pb-8">
          {children}
        </div>
      </main>

      <AppTour />
    </div>
  );
}
