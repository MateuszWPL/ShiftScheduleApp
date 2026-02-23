"use client";

import { useMemo } from "react";
import { type Shift } from "@/lib/api";
import { Clock, Calendar } from "lucide-react";

function parseTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function MyShiftsList({
  shifts,
  currentUserId,
}: {
  shifts: Shift[];
  currentUserId: string;
}) {
  const myShifts = useMemo(() => {
    return shifts
      .filter((s) => s.assignments?.some((a) => a.userId === currentUserId))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [shifts, currentUserId]);

  if (myShifts.length === 0) {
    return (
      <div className="bg-white border border-brand-warm rounded-xl p-12 text-center">
        <Calendar className="h-10 w-10 mx-auto mb-3 text-brand-dark-soft" />
        <p className="text-sm font-medium text-brand-dark-muted">Brak Twoich zmian w tym tygodniu</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full min-w-0">
      {myShifts.map((s) => {
        const isDraft = s.status === "DRAFT";
        const isMarketplace = s.assignments?.[0]?.isUpForGrabs;
        return (
          <div
            key={s.id}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-colors min-w-0 ${
              isDraft
                ? "border-dashed border-amber-300/70 bg-amber-50/40"
                : isMarketplace
                ? "border-brand/20 bg-brand-muted/50"
                : "border-brand-warm bg-white"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold flex-shrink-0 ${
                isDraft ? "bg-amber-100 text-amber-700" : "bg-brand-blue-muted text-brand-blue"
              }`}
            >
              <span className="uppercase leading-tight">
                {new Date(s.startTime).toLocaleDateString("pl-PL", { weekday: "narrow" })}
              </span>
              <span className="text-sm">{new Date(s.startTime).getDate()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-dark truncate">{s.roleName}</p>
              <p className="text-xs text-brand-dark-muted truncate">{formatDay(s.startTime)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand-dark shrink-0">
              <Clock className="h-4 w-4 text-brand-dark-muted" />
              {parseTime(s.startTime)}–{parseTime(s.endTime)}
            </div>
            {isDraft && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                Szkic
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
