"use client";

import { useCallback, useRef, useState, useEffect } from "react";

const MINUTES_PER_DAY = 24 * 60;
const SNAP = 15;

function snap(minutes: number): number {
  return Math.round(minutes / SNAP) * SNAP;
}

function clamp(minutes: number): number {
  return Math.max(0, Math.min(MINUTES_PER_DAY, minutes));
}

function minToPercent(min: number): number {
  return (min / MINUTES_PER_DAY) * 100;
}

export interface TimeBlock {
  id?: string;
  startMin: number;
  endMin: number;
}

interface TimeBlockStripProps {
  /** Etykieta dnia (np. "Pon 10.02") */
  label: string;
  /** Zapisane bloki (do wyświetlenia, z id do usunięcia) */
  blocks?: TimeBlock[];
  /** Minimalna długość bloku (minuty) */
  minBlockMinutes: number;
  /** Tryb pojedynczego bloku (np. zmiana) – brak wielu bloków, jeden edytowalny */
  singleBlock?: boolean;
  /** Wartość w trybie singleBlock: jeden blok */
  value?: { startMin: number; endMin: number } | null;
  /** Zmiana w trybie singleBlock */
  onChange?: (v: { startMin: number; endMin: number } | null) => void;
  /** Draft (nowy blok) w trybie wielu bloków */
  draft?: { startMin: number; endMin: number } | null;
  /** Zmiana draftu */
  onDraftChange?: (draft: { startMin: number; endMin: number } | null) => void;
  /** Potwierdzenie draftu (dodanie slotu) */
  onConfirmDraft?: () => void;
  /** Usunięcie zapisanego bloku */
  onDeleteBlock?: (id: string) => void;
  /** Czy wyłączone (np. ładowanie) */
  disabled?: boolean;
}

export function TimeBlockStrip({
  label,
  blocks = [],
  minBlockMinutes,
  singleBlock = false,
  value = null,
  onChange,
  draft = null,
  onDraftChange,
  onConfirmDraft,
  onDeleteBlock,
  disabled = false,
}: TimeBlockStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"move" | "resize-left" | "resize-right" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const dragInitialRef = useRef<{ startMin: number; endMin: number }>({ startMin: 0, endMin: 0 });
  const justFinishedDragRef = useRef(false);

  const getMinutesFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const el = stripRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const x = ("clientX" in e ? e.clientX : (e as MouseEvent).clientX) - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      return clamp(snap(pct * MINUTES_PER_DAY));
    },
    [],
  );

  const handleStripClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      if (justFinishedDragRef.current) {
        justFinishedDragRef.current = false;
        return;
      }
      const minutes = getMinutesFromEvent(e);
      if (singleBlock) {
        const start = minutes;
        const end = clamp(snap(minutes + minBlockMinutes));
        onChange?.({ startMin: start, endMin: end });
        return;
      }
      const end = clamp(snap(minutes + minBlockMinutes));
      onDraftChange?.({ startMin: minutes, endMin: end });
    },
    [disabled, getMinutesFromEvent, minBlockMinutes, singleBlock, onChange, onDraftChange],
  );

  const handleMouseDownBlock = useCallback(
    (e: React.MouseEvent, block: TimeBlock, kind: "move" | "resize-left" | "resize-right") => {
      e.stopPropagation();
      if (disabled) return;
      setDragging(kind);
      setDragStartX(getMinutesFromEvent(e));
      dragInitialRef.current = { startMin: block.startMin, endMin: block.endMin };
    },
    [disabled, getMinutesFromEvent],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const currentMin = getMinutesFromEvent(e);
      const delta = currentMin - dragStartX;
      const init = dragInitialRef.current;
      if (singleBlock && value) {
        if (dragging === "move") {
          const len = init.endMin - init.startMin;
          const start = clamp(snap(init.startMin + delta));
          const end = clamp(snap(start + len));
          onChange?.({ startMin: start, endMin: Math.min(end, MINUTES_PER_DAY) });
        } else if (dragging === "resize-left") {
          const newStart = clamp(snap(init.startMin + delta));
          const startMin = Math.min(newStart, init.endMin - minBlockMinutes);
          onChange?.({ startMin, endMin: init.endMin });
        } else if (dragging === "resize-right") {
          const newEnd = clamp(snap(init.endMin + delta));
          const startMin = init.startMin;
          onChange?.({ startMin, endMin: Math.max(startMin + minBlockMinutes, Math.min(newEnd, MINUTES_PER_DAY)) });
        }
        return;
      }
      if (dragging === "move" && draft) {
        const len = init.endMin - init.startMin;
        const start = clamp(snap(init.startMin + delta));
        const end = clamp(snap(start + len));
        onDraftChange?.({ startMin: start, endMin: Math.min(end, MINUTES_PER_DAY) });
      } else if (dragging === "resize-left" && draft) {
        const newStart = clamp(snap(init.startMin + delta));
        const startMin = Math.min(newStart, init.endMin - minBlockMinutes);
        onDraftChange?.({ startMin, endMin: init.endMin });
      } else if (dragging === "resize-right" && draft) {
        const newEnd = clamp(snap(init.endMin + delta));
        onDraftChange?.({ startMin: init.startMin, endMin: Math.max(init.startMin + minBlockMinutes, Math.min(newEnd, MINUTES_PER_DAY)) });
      }
    };
    const onUp = () => {
      justFinishedDragRef.current = dragging !== null;
      setDragging(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragStartX, singleBlock, value, draft, onChange, onDraftChange, minBlockMinutes, getMinutesFromEvent]);

  const displayBlocks = singleBlock && value ? [value] : blocks;
  const editableBlock = singleBlock ? value : draft;

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {!singleBlock && editableBlock && onConfirmDraft && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirmDraft();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Dodaj
          </button>
        )}
      </div>
      <div
        ref={stripRef}
        role="slider"
        aria-label={`Pasmo godzin ${label}`}
        className="relative h-10 w-full rounded-lg bg-slate-100 border border-slate-200 cursor-crosshair overflow-hidden"
        onClick={handleStripClick}
      >
        {/* Godziny 0-24 */}
        {[0, 6, 12, 18, 24].map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-slate-300"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
        {[0, 6, 12, 18, 24].map((h) => (
          <span
            key={h}
            className="absolute text-[10px] text-slate-400 -translate-x-1/2 top-0.5"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h}
          </span>
        ))}
        {/* Zapisane bloki */}
        {!singleBlock &&
          blocks.map((b) => (
            <div
              key={b.id ?? `${b.startMin}-${b.endMin}`}
              className="absolute top-1 bottom-1 rounded bg-blue-200 border border-blue-300 flex items-center justify-end pr-1"
              style={{
                left: `${minToPercent(b.startMin)}%`,
                width: `${minToPercent(b.endMin - b.startMin)}%`,
              }}
            >
              <span className="text-[10px] text-blue-800 truncate">
                {String(Math.floor(b.startMin / 60)).padStart(2, "0")}:{String(b.startMin % 60).padStart(2, "0")}–
                {String(Math.floor(b.endMin / 60)).padStart(2, "0")}:{String(b.endMin % 60).padStart(2, "0")}
              </span>
              {onDeleteBlock && b.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBlock(b.id!);
                  }}
                  className="ml-1 text-red-600 hover:text-red-800 text-xs font-bold"
                  aria-label="Usuń"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        {/* Edytowalny blok (draft lub single) */}
        {editableBlock && (
          <div
            className="absolute top-1 bottom-1 rounded bg-emerald-500 border-2 border-emerald-600 cursor-grab active:cursor-grabbing flex items-center justify-between px-1"
            style={{
              left: `${minToPercent(editableBlock.startMin)}%`,
              width: `${minToPercent(editableBlock.endMin - editableBlock.startMin)}%`,
            }}
            onMouseDown={(e) => handleMouseDownBlock(e, editableBlock, "move")}
          >
            <span
              className="w-2 h-full rounded-l cursor-ew-resize shrink-0"
              onMouseDown={(e) => handleMouseDownBlock(e, editableBlock, "resize-left")}
            />
            <span className="text-[10px] text-white font-medium pointer-events-none">
              {Math.floor(editableBlock.startMin / 60)}:{String(editableBlock.startMin % 60).padStart(2, "0")} –
              {Math.floor(editableBlock.endMin / 60)}:{String(editableBlock.endMin % 60).padStart(2, "0")}
            </span>
            <span
              className="w-2 h-full rounded-r cursor-ew-resize shrink-0"
              onMouseDown={(e) => handleMouseDownBlock(e, editableBlock, "resize-right")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function minutesToTime(startMin: number, endMin: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
    end: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`,
  };
}
