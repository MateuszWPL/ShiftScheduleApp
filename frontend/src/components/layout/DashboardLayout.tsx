"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  userAvatar?: string | null;
  onLogout: () => void;
}

export function DashboardLayout({ children, userRole, userName, userAvatar, onLogout }: Props) {
  const isAdmin = userRole === "OWNER" || userRole === "MANAGER";
  const roleLabel = userRole === "OWNER" ? "Właściciel" : userRole === "MANAGER" ? "Menedżer" : "Pracownik";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-wider">ShiftApp <span className="text-blue-500">B2B</span></h1>
          <p className="text-xs text-slate-500 mt-1 uppercase">{roleLabel}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" asChild>
            <Link href="/">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Pulpit
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" asChild>
            <Link href="/">
              <Calendar className="mr-2 h-4 w-4" /> Grafik
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" asChild>
            <Link href="/team">
              <Users className="mr-2 h-4 w-4" /> Zespół
            </Link>
          </Button>
          
          {/* Profil - dostępny dla wszystkich */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" /> Mój Profil
              </Link>
            </Button>
          </div>
        </nav>

        {/* User info w stopce */}
        {userName && (
          <div className="p-4 border-t border-slate-800 flex items-center gap-3">
            <Avatar src={userAvatar} name={userName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-800">
          <Button variant="destructive" className="w-full" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Wyloguj
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative flex flex-col">
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
          <span className="font-bold">ShiftApp</span>
          <Button size="sm" variant="ghost" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
        </header>

        <div className="flex-1 p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}