"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { useLocation } from "@/components/providers/LocationContext";
import { Location } from "@/lib/api";

interface LocationSwitcherProps {
  isAdmin: boolean;
  /** compact = mobile/smaller variant */
  compact?: boolean;
}

export function LocationSwitcher({ isAdmin, compact = false }: LocationSwitcherProps) {
  const { locations, activeLocation, activeLocationId, setActiveLocationId, isLoading } =
    useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-brand-dark-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {!compact && <span className="text-xs">Ładowanie...</span>}
      </div>
    );
  }

  if (locations.length === 0 && !isAdmin) return null;

  const displayName = activeLocation?.name ?? "Wybierz lokalizację";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer touch-manipulation
          ${open
            ? "bg-brand/10 text-brand"
            : "text-brand-dark hover:bg-brand-warm-light"
          }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MapPin className={`flex-shrink-0 ${compact ? "h-4 w-4" : "h-3.5 w-3.5"} text-brand`} />
        {!compact && (
          <span className="flex-1 text-left truncate text-xs font-semibold text-brand-dark">
            {displayName}
          </span>
        )}
        <ChevronDown
          className={`flex-shrink-0 h-3 w-3 text-brand-dark-soft transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 bg-white rounded-xl shadow-xl border border-brand-warm overflow-hidden
            ${compact
              ? "left-0 top-full mt-1 w-56"
              : "left-0 right-0 top-full mt-1"
            }`}
          role="listbox"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-brand-warm/60">
            <p className="text-[10px] font-semibold text-brand-dark-muted uppercase tracking-wider">
              Lokalizacje
            </p>
          </div>

          {/* Location list */}
          <div className="py-1 max-h-52 overflow-y-auto">
            {locations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-brand-dark-muted">
                Brak lokalizacji. Dodaj pierwszą.
              </p>
            ) : (
              locations.map((loc: Location) => (
                <button
                  key={loc.id}
                  role="option"
                  aria-selected={loc.id === activeLocationId}
                  onClick={() => {
                    setActiveLocationId(loc.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-100 cursor-pointer
                    ${loc.id === activeLocationId
                      ? "bg-brand/8 text-brand font-semibold"
                      : "text-brand-dark hover:bg-brand-warm-light"
                    }`}
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-dark-soft" />
                  <span className="flex-1 truncate text-xs">{loc.name}</span>
                  {loc.id === activeLocationId && (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand" />
                  )}
                  {loc.isDefault && loc.id !== activeLocationId && (
                    <span className="text-[9px] text-brand-dark-muted font-medium">domyślna</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Admin: add location */}
          {isAdmin && (
            <div className="border-t border-brand-warm/60 py-1">
              <button
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("open-add-location-dialog"));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand font-medium hover:bg-brand-muted/40 transition-colors duration-100 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Dodaj lokalizację
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
