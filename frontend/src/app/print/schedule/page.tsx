"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getShifts, getTeamMembers, type Shift, type User } from "@/lib/api";

function getDaysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const finish = new Date(end);
  finish.setHours(0, 0, 0, 0);
  
  while (current <= finish) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
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

  const daysRange = useMemo(() => {
    if (!from || !to) return [];
    return getDaysBetween(new Date(from), new Date(to));
  }, [from, to]);

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

  // Chunk days into weeks (up to 7 days per table)
  const weeks: Date[][] = [];
  for (let i = 0; i < daysRange.length; i += 7) {
    weeks.push(daysRange.slice(i, i + 7));
  }

  const grid = new Map<string, Shift[]>();
  for (const m of employeesOnly) {
    for (const d of daysRange) {
      grid.set(`${m.id}-${toLocalDateKey(d)}`, []);
    }
  }

  let assignedShiftsCount = 0;
  for (const shift of shifts) {
    const dKey = toLocalDateKey(new Date(shift.startTime));
    for (const a of shift.assignments || []) {
      if (a.userId) {
        const key = `${a.userId}-${dKey}`;
        if (grid.has(key)) {
          grid.get(key)!.push(shift);
          assignedShiftsCount++;
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
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
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
          <h1 className="text-xl font-bold uppercase tracking-wide">Raport Grafiku</h1>
          <p className="text-sm text-gray-600 mt-1">
            Okres: {daysRange[0]?.toLocaleDateString("pl-PL")} – {daysRange[daysRange.length - 1]?.toLocaleDateString("pl-PL")}
          </p>
          <p className="text-xs text-brand-dark/70 font-medium mt-1">
            Znaleziono {assignedShiftsCount} przypisanych zmian w wybranym okresie dla {employeesOnly.length} pracowników.
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Wygenerowano z systemu ShiftSchedule
        </div>
      </div>

      {weeks.map((weekDays, weekIndex) => (
        <div key={weekIndex} className={`mb-8 avoid-break ${weekIndex > 0 && weekIndex % 2 === 0 ? 'page-break' : ''}`}>
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Tydzień {weekIndex + 1} ({weekDays[0].toLocaleDateString("pl-PL")} – {weekDays[weekDays.length - 1].toLocaleDateString("pl-PL")})
          </h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: "140px" }}>Pracownik</th>
                {weekDays.map((d) => (
                  <th key={d.toISOString()} style={{ width: "calc(100% / 7)" }}>
                    {d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
                  </th>
                ))}
                {/* Wypełnienie mniejszych tygodni pustymi kolumnami dla wyrównania układu tabeli */}
                {Array.from({ length: 7 - weekDays.length }).map((_, i) => (
                  <th key={`empty-th-${i}`} style={{ width: "calc(100% / 7)" }}></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employeesOnly.map((m) => {
                // Jeśli pracownik nie ma zmian w tym konkretnym tygodniu, pomijamy go dla czystości wydruku dużych zakresów
                const hasShiftsThisWeek = weekDays.some((d) => {
                  const key = `${m.id}-${toLocalDateKey(d)}`;
                  return (grid.get(key) || []).length > 0;
                });
                if (!hasShiftsThisWeek && daysRange.length > 14) return null;

                return (
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
                    {Array.from({ length: 7 - weekDays.length }).map((_, i) => (
                      <td key={`empty-td-${i}`} className="bg-gray-50/50"></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
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
