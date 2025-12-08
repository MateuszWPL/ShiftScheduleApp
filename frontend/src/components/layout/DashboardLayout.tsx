"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut
} from "lucide-react"; // Upewnij się, że masz lucide-react (shadcn instaluje domyślnie)

interface Props {
  children: React.ReactNode;
  userRole?: string;
  onLogout: () => void;
}

export function DashboardLayout({ children, userRole, onLogout }: Props) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR (LEWY PANEL) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-wider">ShiftApp <span className="text-blue-500">B2B</span></h1>
          <p className="text-xs text-slate-500 mt-1 uppercase">{userRole || "Pracownik"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Przykładowe linki - na razie atrapy */}
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Pulpit
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
            <Calendar className="mr-2 h-4 w-4" /> Grafik
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
            <Users className="mr-2 h-4 w-4" /> Zespół
          </Button>
          <div className="pt-4 mt-4 border-t border-slate-800">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <Settings className="mr-2 h-4 w-4" /> Ustawienia
            </Button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button variant="destructive" className="w-full" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Wyloguj
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT (PRAWA STRONA) */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        {/* Mobile Header (opcjonalny, na razie prosty pasek) */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
          <span className="font-bold">ShiftApp</span>
          <Button size="sm" variant="ghost" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
        </header>

        {/* Content właściwy - wstrzykiwany tutaj */}
        <div className="flex-1 p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}