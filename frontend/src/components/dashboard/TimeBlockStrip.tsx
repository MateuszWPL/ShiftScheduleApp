"use client";

import { useCallback, useRef, useState, useEffect } from "react";

const MINUTES_PER_DAY = 24 * 60;
const SNAP = 15;
const HOURS = Array.from({ length: 25 }, (_, i) => i);

function snap(minutes: number): number {
  return Math.round(minutes / SNAP) * SNAP;
}

function clamp(minutes: number): number {
  return Math.max(0, Math.min(MINUTES_PER_DAY, minutes));
}

function minToPercent(min: number): number {
  return (min / MINUTES_PER_DAY) * 100;
}

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface TimeBlock {
  id?: string;
  startMin: number;
  endMin: number;
}

interface TimeBlockStripProps {
  /** Etykieta dnia (np. "Pon 10.02") — shown externally in table mode */
  label?: string;
  /** Show label inside component */
  showLabel?: boolean;
  /** Zapisane bloki */
  blocks?: TimeBlock[];
  /** Minimalna długość bloku (minuty) */
  minBlockMinutes: number;
  /** Tryb pojedynczego bloku */
  singleBlock?: boolean;
  /** Wartość w trybie singleBlock */
  value?: { startMin: number; endMin: number } | null;
  /** Zmiana w trybie singleBlock */
  onChange?: (v: { startMin: number; endMin: number } | null) => void;
  /** Draft bloki w trybie wielu bloków (managed externally) */
  drafts?: TimeBlock[];
  /** Callback when a new draft block is created via drag */
  onDraftCreate?: (block: { startMin: number; endMin: number }) => void;
  /** Usunięcie zapisanego bloku */
  onDeleteBlock?: (id: string) => void;
  /** Aktualizacja zapisanego bloku (resize) */
  onUpdateBlock?: (id: string, startMin: number, endMin: number) => void;
  /** Strip height */
  height?: number;
  /** Czy wyłączone */
  disabled?: boolean;
  /** Show hour labels */
  showHourLabels?: boolean;
  /** Compact mode (no padding for table rows) */
  compact?: boolean;
}

export function TimeBlockStrip({
  label,
  showLabel = false,
  blocks = [],
  minBlockMinutes,
  singleBlock = false,
  value = null,
  onChange,
  drafts = [],
  onDraftCreate,
  onDeleteBlock,
  onUpdateBlock,
  height = 44,
  disabled = false,
  showHourLabels = true,
  compact = false,
}: TimeBlockStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragMode, setDragMode] = useState<
    "create" | "move" | "resize-left" | "resize-right" | null
  >(null);
  const [dragStartMin, setDragStartMin] = useState(0);
  const [createPreview, setCreatePreview] = useState<{
    startMin: number;
    endMin: number;
  } | null>(null);
  const dragInitialRef = useRef<{ startMin: number; endMin: number }>({
    startMin: 0,
    endMin: 0,
  });
  const justFinishedDragRef = useRef(false);
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizePreview, setResizePreview] = useState<{ startMin: number; endMin: number } | null>(null);

  const getClientX = useCallback((e: MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) return e.touches[0].clientX;
    if ("changedTouches" in e && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return (e as MouseEvent).clientX;
  }, []);

  const getMinutesFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
      const el = stripRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const clientX = "clientX" in e ? e.clientX : getClientX(e as TouchEvent);
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      return clamp(snap(pct * MINUTES_PER_DAY));
    },
    [getClientX]
  );

  const startCreate = useCallback(
    (minutes: number) => {
      if (singleBlock) {
        setDragMode("create");
        setDragStartMin(minutes);
        setCreatePreview({ startMin: minutes, endMin: minutes });
        onChange?.({ startMin: minutes, endMin: clamp(minutes + minBlockMinutes) });
      } else {
        setDragMode("create");
        setDragStartMin(minutes);
        setCreatePreview({ startMin: minutes, endMin: minutes });
      }
    },
    [singleBlock, onChange, minBlockMinutes]
  );

  const handleStripTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const minutes = getMinutesFromEvent(e);
      startCreate(minutes);
    },
    [disabled, getMinutesFromEvent, startCreate]
  );

  // Mousedown on empty strip area → start creating
  const handleStripMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      if (e.button !== 0) return;
      const minutes = getMinutesFromEvent(e);
      startCreate(minutes);
    },
    [disabled, getMinutesFromEvent, startCreate]
  );

  // Mousedown on existing block → drag/resize
  const handleBlockMouseDown = useCallback(
    (
      e: React.MouseEvent,
      block: { startMin: number; endMin: number },
      kind: "move" | "resize-left" | "resize-right"
    ) => {
      e.stopPropagation();
      if (disabled) return;
      setDragMode(kind);
      setDragStartMin(getMinutesFromEvent(e));
      dragInitialRef.current = { startMin: block.startMin, endMin: block.endMin };
    },
    [disabled, getMinutesFromEvent]
  );

  useEffect(() => {
    if (!dragMode) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const currentMin = getMinutesFromEvent(e);

      if (dragMode === "create") {
        const lo = Math.min(dragStartMin, currentMin);
        const hi = Math.max(dragStartMin, currentMin);
        const preview = { startMin: lo, endMin: hi };
        setCreatePreview(preview);

        if (singleBlock) {
          const endMin = Math.max(hi, lo + minBlockMinutes);
          onChange?.({ startMin: lo, endMin: clamp(endMin) });
        }
        return;
      }

      const delta = currentMin - dragStartMin;
      const init = dragInitialRef.current;

      if (resizingBlockId) {
        if (dragMode === "resize-left") {
          const newStart = clamp(snap(init.startMin + delta));
          const startMin = Math.min(newStart, init.endMin - minBlockMinutes);
          setResizePreview({ startMin, endMin: init.endMin });
        } else if (dragMode === "resize-right") {
          const newEnd = clamp(snap(init.endMin + delta));
          setResizePreview({
            startMin: init.startMin,
            endMin: Math.max(init.startMin + minBlockMinutes, Math.min(newEnd, MINUTES_PER_DAY)),
          });
        }
        return;
      }

      if (singleBlock && value) {
        if (dragMode === "move") {
          const len = init.endMin - init.startMin;
          const start = clamp(snap(init.startMin + delta));
          const end = clamp(start + len);
          onChange?.({ startMin: start, endMin: Math.min(end, MINUTES_PER_DAY) });
        } else if (dragMode === "resize-left") {
          const newStart = clamp(snap(init.startMin + delta));
          const startMin = Math.min(newStart, init.endMin - minBlockMinutes);
          onChange?.({ startMin, endMin: init.endMin });
        } else if (dragMode === "resize-right") {
          const newEnd = clamp(snap(init.endMin + delta));
          onChange?.({
            startMin: init.startMin,
            endMin: Math.max(init.startMin + minBlockMinutes, Math.min(newEnd, MINUTES_PER_DAY)),
          });
        }
      }
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      if (resizingBlockId && resizePreview && onUpdateBlock) {
        onUpdateBlock(resizingBlockId, resizePreview.startMin, resizePreview.endMin);
      }

      if (dragMode === "create" && !singleBlock) {
        const currentMin = getMinutesFromEvent(e);
        const lo = Math.min(dragStartMin, currentMin);
        const hi = Math.max(dragStartMin, currentMin);
        const duration = hi - lo;

        if (duration >= minBlockMinutes) {
          onDraftCreate?.({ startMin: lo, endMin: hi });
        } else {
          const endMin = clamp(lo + minBlockMinutes);
          onDraftCreate?.({ startMin: lo, endMin });
        }
      }

      justFinishedDragRef.current = dragMode !== null;
      setDragMode(null);
      setCreatePreview(null);
      setResizingBlockId(null);
      setResizePreview(null);
    };

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      onMove(e);
    };
    const upHandler = (e: MouseEvent | TouchEvent) => {
      onUp(e);
    };
    window.addEventListener("mousemove", onMove as (e: MouseEvent) => void);
    window.addEventListener("mouseup", onUp as (e: MouseEvent) => void);
    window.addEventListener("touchmove", moveHandler, { passive: false });
    window.addEventListener("touchend", upHandler);
    window.addEventListener("touchcancel", upHandler);
    return () => {
      window.removeEventListener("mousemove", onMove as (e: MouseEvent) => void);
      window.removeEventListener("mouseup", onUp as (e: MouseEvent) => void);
      window.removeEventListener("touchmove", moveHandler);
      window.removeEventListener("touchend", upHandler);
      window.removeEventListener("touchcancel", upHandler);
    };
  }, [
    dragMode,
    dragStartMin,
    singleBlock,
    value,
    onChange,
    onDraftCreate,
    onUpdateBlock,
    minBlockMinutes,
    getMinutesFromEvent,
    resizingBlockId,
    resizePreview,
  ]);

  const editableBlock = singleBlock ? value : null;

  return (
    <div className={`select-none ${compact ? "" : ""}`}>
      {showLabel && label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-brand-dark">{label}</span>
        </div>
      )}

      <div
        ref={stripRef}
        role="slider"
        aria-label={`Pasmo godzin ${label || ""}`}
        className={`relative w-full bg-brand-warm-light cursor-crosshair overflow-hidden touch-none ${
          compact ? "rounded-none" : "rounded-lg border border-brand-warm"
        }`}
        style={{ height }}
        onMouseDown={handleStripMouseDown}
        onTouchStart={handleStripTouchStart}
      >
        {/* Hour grid lines */}
        {HOURS.map((h) => (
          <div
            key={`line-${h}`}
            className={`absolute top-0 bottom-0 ${
              h % 6 === 0
                ? "border-l border-brand-blue"
                : h % 3 === 0
                ? "border-l border-brand-warm"
                : "border-l border-brand-warm/50"
            }`}
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}

        {/* Hour labels */}
        {showHourLabels &&
          HOURS.filter((h) => h % 3 === 0).map((h) => (
            <span
              key={`label-${h}`}
              className="absolute text-[9px] text-brand-dark-soft pointer-events-none select-none"
              style={{
                left: `${(h / 24) * 100}%`,
                top: "1px",
                transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {h}:00
            </span>
          ))}

        {/* Saved blocks */}
        {blocks.map((b) => {
          const isResizing = resizingBlockId === b.id;
          const displayStart = isResizing && resizePreview ? resizePreview.startMin : b.startMin;
          const displayEnd = isResizing && resizePreview ? resizePreview.endMin : b.endMin;
          const canResize = !!onUpdateBlock && !!b.id;

          return (
            <div
              key={b.id ?? `saved-${b.startMin}-${b.endMin}`}
              className={`absolute rounded-md bg-brand-blue/80 border border-brand-blue flex items-center group ${
                canResize ? "justify-between" : "justify-between px-1"
              }`}
              style={{
                left: `${minToPercent(displayStart)}%`,
                width: `${minToPercent(displayEnd - displayStart)}%`,
                top: showHourLabels ? "14px" : "2px",
                bottom: "2px",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {canResize && (
                <span
                  className="w-2.5 h-full cursor-ew-resize shrink-0 flex items-center justify-center hover:bg-white/20 rounded-l-md touch-none"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    setResizingBlockId(b.id!);
                    setDragMode("resize-left");
                    setDragStartMin(getMinutesFromEvent(e));
                    dragInitialRef.current = { startMin: b.startMin, endMin: b.endMin };
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (disabled) return;
                    setResizingBlockId(b.id!);
                    setDragMode("resize-left");
                    setDragStartMin(getMinutesFromEvent(e));
                    dragInitialRef.current = { startMin: b.startMin, endMin: b.endMin };
                  }}
                >
                  <span className="w-0.5 h-3 bg-white/60 rounded" />
                </span>
              )}
              <span className="text-[10px] text-white font-medium truncate pointer-events-none flex-1 text-center">
                {formatTime(displayStart)}–{formatTime(displayEnd)}
              </span>
              {onDeleteBlock && b.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBlock(b.id!);
                  }}
                  className="ml-0.5 text-white/70 hover:text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
                  aria-label="Usuń"
                >
                  ×
                </button>
              )}
              {canResize && (
                <span
                  className="w-2.5 h-full cursor-ew-resize shrink-0 flex items-center justify-center hover:bg-white/20 rounded-r-md touch-none"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    setResizingBlockId(b.id!);
                    setDragMode("resize-right");
                    setDragStartMin(getMinutesFromEvent(e));
                    dragInitialRef.current = { startMin: b.startMin, endMin: b.endMin };
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (disabled) return;
                    setResizingBlockId(b.id!);
                    setDragMode("resize-right");
                    setDragStartMin(getMinutesFromEvent(e));
                    dragInitialRef.current = { startMin: b.startMin, endMin: b.endMin };
                  }}
                >
                  <span className="w-0.5 h-3 bg-white/60 rounded" />
                </span>
              )}
            </div>
          );
        })}

        {/* Draft blocks (multi-block mode) */}
        {drafts.map((d, idx) => (
          <div
            key={`draft-${idx}-${d.startMin}-${d.endMin}`}
            className="absolute rounded-md bg-emerald-500/80 border-2 border-emerald-600/60 border-dashed flex items-center justify-center"
            style={{
              left: `${minToPercent(d.startMin)}%`,
              width: `${minToPercent(d.endMin - d.startMin)}%`,
              top: showHourLabels ? "14px" : "2px",
              bottom: "2px",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] text-white font-medium pointer-events-none">
              {formatTime(d.startMin)}–{formatTime(d.endMin)}
            </span>
          </div>
        ))}

        {/* Create preview (while dragging to create) */}
        {dragMode === "create" && createPreview && !singleBlock && (
          <div
            className="absolute rounded-md bg-emerald-400/50 border-2 border-emerald-500/60 border-dashed"
            style={{
              left: `${minToPercent(createPreview.startMin)}%`,
              width: `${minToPercent(
                Math.max(createPreview.endMin - createPreview.startMin, 1)
              )}%`,
              top: showHourLabels ? "14px" : "2px",
              bottom: "2px",
            }}
          />
        )}

        {/* Editable block (singleBlock mode) */}
        {editableBlock && (
          <div
            className="absolute rounded-md bg-emerald-500 border-2 border-emerald-600 cursor-grab active:cursor-grabbing flex items-center justify-between group"
            style={{
              left: `${minToPercent(editableBlock.startMin)}%`,
              width: `${minToPercent(editableBlock.endMin - editableBlock.startMin)}%`,
              top: showHourLabels ? "14px" : "2px",
              bottom: "2px",
            }}
            onMouseDown={(e) => handleBlockMouseDown(e, editableBlock, "move")}
          >
            {/* Left resize handle */}
            <span
              className="w-2 h-full cursor-ew-resize shrink-0 flex items-center justify-center hover:bg-white/20 rounded-l-md"
              onMouseDown={(e) =>
                handleBlockMouseDown(e, editableBlock, "resize-left")
              }
            >
              <span className="w-0.5 h-3 bg-white/60 rounded" />
            </span>
            <span className="text-[10px] text-white font-semibold pointer-events-none whitespace-nowrap">
              {formatTime(editableBlock.startMin)} – {formatTime(editableBlock.endMin)}
            </span>
            {/* Right resize handle */}
            <span
              className="w-2 h-full cursor-ew-resize shrink-0 flex items-center justify-center hover:bg-white/20 rounded-r-md"
              onMouseDown={(e) =>
                handleBlockMouseDown(e, editableBlock, "resize-right")
              }
            >
              <span className="w-0.5 h-3 bg-white/60 rounded" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function minutesToTime(
  startMin: number,
  endMin: number
): { start: string; end: string } {
  return {
    start: formatTime(startMin),
    end: formatTime(endMin),
  };
}
