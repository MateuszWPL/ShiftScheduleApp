"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPlanStatus } from "@/lib/api";
import { AppTour } from "@/components/onboarding/AppTour";
import { LimitExceededBanner } from "@/components/billing/LimitExceededBanner";
import { Button } from "@/components/ui/button";
import { LocationProvider } from "@/components/providers/LocationContext";
import { LocationSwitcher } from "@/components/layout/LocationSwitcher";
import { AddLocationDialog } from "@/components/locations/AddLocationDialog";
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
import { Logo } from "@/components/brand/Logo";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

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
  premiumLabel?: string;
  tourId?: string;
}

function NavLink({
  href,
  label,
  icon,
  active,
  premium,
  premiumLabel,
  showBadge,
  tourId,
}: NavItem & { active: boolean; showBadge?: boolean; tourId?: string }) {
  return (
    <Link
      href={href}
      data-tour={tourId}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer touch-manipulation transition-colors duration-150 active:bg-brand-warm-light/80 ${
        active
          ? "bg-brand/10 text-brand"
          : "text-brand-dark-muted hover:text-brand-dark hover:bg-brand-warm-light"
      }`}
    >
      <span className={active ? "text-brand" : "text-brand-dark-soft"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {premium && showBadge && (
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-brand bg-brand-muted px-1.5 py-0.5 rounded-full">
          <Crown className="h-2.5 w-2.5" />
          {premiumLabel ?? "Starter+"}
        </span>
      )}
    </Link>
  );
}

export function DashboardLayout({ children, userRole, userName, userAvatar, onLogout }: Props) {
  const pathname = usePathname();
  const roleLabel = userRole === "OWNER" ? "Właściciel" : userRole === "MANAGER" ? "Menedżer" : "Pracownik";
  const isAdmin = userRole === "OWNER" || userRole === "MANAGER";
  const isOwner = userRole === "OWNER";

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
  });
  const hasStarter = planStatus?.hasStarter ?? false;
  const planLabel =
    planStatus?.planId === "business"
      ? "Business+"
      : planStatus?.planId === "starter"
        ? "Starter+"
        : null;

  const mainNav: NavItem[] = [
    { href: paths.home, label: "Pulpit", icon: <LayoutDashboard className="h-4 w-4" />, tourId: "nav-pulpit" },
    { href: paths.grafik, label: "Grafik", icon: <Calendar className="h-4 w-4" />, tourId: "nav-grafik" },
    { href: paths.podsumowanie, label: "Podsumowanie", icon: <BarChart3 className="h-4 w-4" />, tourId: "nav-podsumowanie" },
    { href: paths.dostepnosc, label: "Dostępność", icon: <CalendarCheck className="h-4 w-4" />, show: userRole === "EMPLOYEE" },
  ];

  const teamNav: NavItem[] = [
    { href: paths.team, label: "Pracownicy", icon: <Users className="h-4 w-4" />, tourId: "nav-team" },
    { href: paths.announcements, label: "Ogłoszenia", icon: <Megaphone className="h-4 w-4" /> },
  ];

  const hasBusiness = planStatus?.hasBusiness ?? false;

  const premiumNav: NavItem[] = [
    { href: paths.reports, label: "Raporty", icon: <PieChart className="h-4 w-4" />, premium: true, premiumLabel: "Starter+" },
    { href: paths.export, label: "Eksport", icon: <FileDown className="h-4 w-4" />, premium: true, premiumLabel: "Starter+" },
    { href: paths.templates, label: "Szablony", icon: <Copy className="h-4 w-4" />, premium: true, premiumLabel: "Business+", show: isAdmin },
  ];

  const isActive = (href: string) => {
    if (href === paths.home) return pathname === paths.home || pathname === "/app";
    return pathname.startsWith(href);
  };

  const renderSection = (title: string, items: NavItem[]) => {
    const visible = items.filter((i) => i.show !== false);
    if (visible.length === 0) return null;
    return (
      <div>
        <p className="text-[10px] font-semibold text-brand-dark-muted uppercase tracking-wider px-3 mb-1.5">{title}</p>
        <div className="space-y-0.5">
          {visible.map((item) => {
            const needsBadge = item.premium && (
              item.premiumLabel === "Business+" ? !hasBusiness : !hasStarter
            );
            return (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                showBadge={needsBadge}
              />
            );
          })}
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
          <Link href={paths.home} className="flex items-center gap-2 min-w-0">
            <Logo variant="icon" className="w-8 h-8 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-brand-dark tracking-tight truncate flex items-center gap-1.5">
                Staffer
                {hasStarter && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-brand bg-brand-muted px-1.5 py-0.5 rounded-full">
                    <Crown className="h-2.5 w-2.5" />
                    {planLabel}
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-brand-dark-muted font-medium uppercase tracking-wider">{roleLabel}</p>
            </div>
          </Link>
          <NotificationBell align="left" />
        </div>

        {/* Location switcher (Business+ only) */}
        {hasBusiness && (
          <div className="px-3 pb-2 border-b border-brand-warm/60">
            <p className="text-[10px] font-semibold text-brand-dark-muted uppercase tracking-wider px-3 mb-1">
              Lokalizacja
            </p>
            <LocationSwitcher isAdmin={isAdmin} />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
          {renderSection("Menu", mainNav)}
          {renderSection("Zespół", teamNav)}
          {renderSection("Premium", premiumNav)}
        </nav>

        {/* Bottom section: Mój Profil, Ustawienia */}
        <div className="border-t border-brand-warm p-3 space-y-1">
          <NavLink href={paths.profile} label="Mój Profil" icon={<User className="h-4 w-4" />} active={isActive(paths.profile)} tourId="nav-profile" />
          {isAdmin && (
            <NavLink href={paths.settings} label="Ustawienia" icon={<Settings className="h-4 w-4" />} active={isActive(paths.settings)} />
          )}
        </div>

        {/* Ulepsz do Pro / Zarządzaj planem */}
        {isOwner && (
          <div className="border-t border-brand-warm p-3">
            <Link
              href={paths.billing}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer touch-manipulation transition-colors duration-150 active:bg-brand/20 ${
                pathname.startsWith(paths.billing)
                  ? "bg-brand/15 text-brand"
                  : "text-brand hover:bg-brand/10 bg-brand-muted/30"
              }`}
            >
              <Crown className="h-4 w-4" />
              <span className="flex-1">{hasStarter ? "Zarządzaj planem" : "Ulepsz plan"}</span>
            </Link>
          </div>
        )}

        {/* User card */}
        {userName && (
          <div className="px-4 py-3 border-t border-brand-warm flex items-center gap-3">
            <Avatar src={userAvatar} name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-dark truncate">{userName}</p>
              <p className="text-[10px] text-brand-dark-muted flex items-center gap-1">
                {roleLabel}
                {hasStarter && (
                  <span className="inline-flex items-center gap-0.5 text-brand font-semibold">
                    <Crown className="h-2.5 w-2.5" />
                    {planLabel}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-brand-dark-soft hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors duration-150"
              title="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <LocationProvider hasBusiness={hasBusiness}>
      <main className="flex-1 overflow-auto relative flex flex-col">
        {/* Mobile header + top nav */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-brand-warm shadow-sm">
          <div className="flex justify-between items-center px-4 py-2">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo variant="icon" className="w-7 h-7 flex-shrink-0" />
              <span className="font-bold text-brand-dark text-sm">Staffer</span>
            </Link>
            {hasBusiness && (
              <div className="flex-1 mx-2 min-w-0 max-w-[160px]">
                <LocationSwitcher isAdmin={isAdmin} compact />
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <NotificationBell />
              <button onClick={onLogout} className="p-2 rounded-lg text-brand-dark-muted hover:text-red-500 cursor-pointer transition-colors duration-150">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Mobile top nav - horizontal scroll */}
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] border-t border-brand-warm/60 hide-scrollbar">
            <nav className="flex justify-start gap-0 px-2 py-1.5 min-w-max">
              {[
                { href: paths.home, icon: <LayoutDashboard className="h-4 w-4 shrink-0" />, label: "Pulpit", tourId: "nav-pulpit" },
                { href: paths.grafik, icon: <Calendar className="h-4 w-4 shrink-0" />, label: "Grafik", tourId: "nav-grafik" },
                { href: paths.podsumowanie, icon: <BarChart3 className="h-4 w-4 shrink-0" />, label: "Podsum.", tourId: "nav-podsumowanie" },
                ...(userRole === "EMPLOYEE" ? [{ href: paths.dostepnosc, icon: <CalendarCheck className="h-4 w-4 shrink-0" />, label: "Dostępn.", tourId: "nav-dostepnosc" }] : []),
                { href: paths.team, icon: <Users className="h-4 w-4 shrink-0" />, label: "Zespół", tourId: "nav-team" },
                { href: paths.profile, icon: <User className="h-4 w-4 shrink-0" />, label: "Profil", tourId: "nav-profile" },
                ...(isOwner ? [{ href: paths.billing, icon: <Crown className="h-4 w-4 shrink-0" />, label: hasStarter ? "Zarządzaj planem" : "Ulepsz plan", tourId: "nav-billing" }] : []),
                ...(isAdmin ? [{ href: paths.settings, icon: <Settings className="h-4 w-4 shrink-0" />, label: "Ustawienia", tourId: "nav-settings" }] : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  {...(item.tourId ? { "data-tour": item.tourId as string } : {})}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-150 shrink-0 touch-manipulation active:bg-brand-warm-light/80 ${
                    isActive(item.href)
                      ? "bg-brand/10 text-brand"
                      : item.href === paths.billing
                        ? "text-brand bg-brand-muted/50 hover:bg-brand/15"
                        : "text-brand-dark-muted hover:bg-brand-warm-light"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <LimitExceededBanner />

        <div className="flex-1 p-4 sm:p-5 md:p-8 min-h-0 overflow-auto">
          {children}
        </div>
      </main>

      <AppTour userRole={userRole} />
      {hasBusiness && isAdmin && <AddLocationDialog />}
      </LocationProvider>
    </div>
  );
}
