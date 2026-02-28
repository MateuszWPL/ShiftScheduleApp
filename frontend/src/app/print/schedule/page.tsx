"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getShifts, getTeamMembers, type Shift, type User } from "@/lib/api";

function getWeekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(x.getDate() + i);
    days.push(x);
  }
  return days;
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function PrintScheduleContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const weekStart = useMemo(() => (from ? new Date(from) : new Date()), [from]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    if (!from || !to) {
      setError("Brak wybranych dat w URL");
      setLoading(false);
      return;
    }

    Promise.all([getShifts({ from, to }), getTeamMembers()])
      .then(([s, m]) => {
        setShifts(s.filter((shift) => shift.status !== "DRAFT"));
        setMembers(m);
        setLoading(false);

        // Z opóźnieniem aby render się skończył
        setTimeout(() => {
          window.print();
        }, 500);
      })
      .catch((err) => {
        setError(err.message || "Błąd pobierania");
        setLoading(false);
      });
  }, [from, to]);

  if (loading) return <div className="p-10 font-sans text-sm">Przygotowywanie grafiku do druku...</div>;
  if (error) return <div className="p-10 font-sans text-red-600 text-sm">Błąd: {error}</div>;

  const employeesOnly = members.filter((m: any) => m.role === "EMPLOYEE");

  const grid = new Map<string, Shift[]>();
  for (const m of employeesOnly) {
    for (const d of weekDays) {
      grid.set(`${m.id}-${toLocalDateKey(d)}`, []);
    }
  }

  for (const shift of shifts) {
    const dKey = toLocalDateKey(new Date(shift.startTime));
    for (const a of shift.assignments || []) {
      if (a.userId) {
        const key = `${a.userId}-${dKey}`;
        if (grid.has(key)) {
          grid.get(key)!.push(shift);
        }
      }
    }
  }

  const parseTime = (iso: string) => {
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : "";
  };

  return (
    <div className="font-sans text-black bg-white min-h-screen p-4 sm:p-8">
      {/* Tylko widoczne na ekranie (opcjonalny interfejs powrotu pownienien byc schowany do druku) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          .no-print { display: none !important; }
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
        th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; }
        td { font-size: 12px; }
      `}} />

      <div className="no-print mb-6">
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-100 rounded text-sm font-medium hover:bg-gray-200 cursor-pointer">
          Zamknij podgląd
        </button>
        <button onClick={() => window.print()} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 cursor-pointer">
          Drukuj ponownie
        </button>
      </div>

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide">Grafik zmian</h1>
          <p className="text-sm text-gray-600 mt-1">
            Okres: {weekDays[0].toLocaleDateString("pl-PL")} – {weekDays[6].toLocaleDateString("pl-PL")}
          </p>
        </div>
        <div className="text-xs text-gray-500"> Wygenerowano z systemu ShiftSchedule</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "140px" }}>Pracownik</th>
            {weekDays.map((d) => (
              <th key={d.toISOString()} style={{ width: "calc(100% / 7)" }}>
                {d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employeesOnly.map((m) => (
            <tr key={m.id}>
              <td className="font-medium">
                {m.nickname || m.name}
              </td>
              {weekDays.map((d) => {
                const key = `${m.id}-${toLocalDateKey(d)}`;
                const dayShifts = grid.get(key) || [];
                return (
                  <td key={key}>
                    {dayShifts.map((s) => (
                      <div key={s.id} className="mb-1 last:mb-0 border-l-2 pl-1.5" style={{ borderColor: s.position?.color || "#cbd5e1" }}>
                        <div className="font-semibold text-[11px] leading-tight">{s.roleName}</div>
                        <div className="text-[10px] text-gray-600">
                          {parseTime(s.startTime)} - {parseTime(s.endTime)}
                        </div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrintSchedulePage() {
  return (
    <Suspense fallback={<div className="p-10 font-sans text-sm">Ładowanie grafiku...</div>}>
      <PrintScheduleContent />
    </Suspense>
  );
}
