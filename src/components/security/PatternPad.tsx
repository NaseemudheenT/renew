"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A 3×3 pattern lock. Connect at least four dots by dragging (touch/mouse) or by
 * tapping them in order — tapping keeps it usable with a keyboard/switch and for
 * anyone who can't drag. The drawn path is reported as a string of node indices
 * ("0-3-6-7"); the same encoding is hashed like any other passcode.
 */
export function PatternPad({
  onComplete,
  disabled,
  size = 240,
}: {
  onComplete: (code: string) => void;
  disabled?: boolean;
  size?: number;
}) {
  const [path, setPath] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pendingStart = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const cell = size / 3;
  const centre = (i: number) => ({ x: (i % 3) * cell + cell / 2, y: Math.floor(i / 3) * cell + cell / 2 });

  function add(i: number) {
    setPath((p) => (p.includes(i) ? p : [...p, i]));
  }

  function nodeAt(clientX: number, clientY: number): number | null {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (let i = 0; i < 9; i++) {
      const c = centre(i);
      if (Math.hypot(x - c.x, y - c.y) < cell * 0.36) return i;
    }
    return null;
  }

  function down(clientX: number, clientY: number) {
    if (disabled) return;
    suppressClick.current = false;
    // Don't reset yet — a plain tap must be able to accumulate. We only begin a
    // fresh drag once the pointer actually moves over another node.
    pendingStart.current = nodeAt(clientX, clientY);
  }
  function move(clientX: number, clientY: number) {
    if (disabled) return;
    const i = nodeAt(clientX, clientY);
    if (i == null) return;
    if (!drawing) {
      if (pendingStart.current == null || i === pendingStart.current) return;
      // Real drag detected: start from the down-node, then add this one.
      setDrawing(true);
      setPath([pendingStart.current, i]);
    } else {
      add(i);
    }
  }
  function up() {
    const startNode = pendingStart.current;
    pendingStart.current = null;
    suppressClick.current = true; // the click that follows pointerup isn't a keyboard tap
    if (drawing) {
      setDrawing(false);
      if (path.length >= 4) onComplete(path.join("-"));
    } else if (startNode != null) {
      // No drag — treat as a tap and accumulate the node in order.
      add(startNode);
    }
  }

  /** Keyboard/AT activation only (pointer taps are handled in up()). */
  function tap(i: number) {
    if (disabled || drawing) return;
    if (suppressClick.current) { suppressClick.current = false; return; }
    add(i);
  }

  function reset() {
    setPath([]);
    setDrawing(false);
    pendingStart.current = null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wrapRef}
        className="relative touch-none select-none"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          const i = nodeAt(e.clientX, e.clientY);
          if (i != null) { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); down(e.clientX, e.clientY); }
        }}
        onPointerMove={(e) => move(e.clientX, e.clientY)}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {/* Connecting lines between chosen dots. */}
        <svg width={size} height={size} className="pointer-events-none absolute inset-0">
          {path.slice(1).map((n, idx) => {
            const a = centre(path[idx]!);
            const b = centre(n);
            return <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-gold-500)" strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
          })}
        </svg>
        {Array.from({ length: 9 }).map((_, i) => {
          const on = path.includes(i);
          const order = path.indexOf(i);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-label={`Dot ${i + 1}${on ? `, position ${order + 1}` : ""}`}
              aria-pressed={on}
              onClick={() => tap(i)}
              className={cn(
                "absolute grid place-items-center rounded-full border-2 transition-colors",
                on ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/25" : "border-[var(--field-border)] bg-[var(--field-bg)]",
              )}
              style={{ left: (i % 3) * cell + cell / 2 - 22, top: Math.floor(i / 3) * cell + cell / 2 - 22, width: 44, height: 44 }}
            >
              <span className={cn("size-3 rounded-full", on ? "bg-[var(--color-gold-500)]" : "bg-[var(--text-muted)]/40")} />
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted">{path.length === 0 ? "Draw a pattern (4+ dots)" : `${path.length} dot${path.length === 1 ? "" : "s"}`}</span>
        {path.length > 0 && (
          <button type="button" onClick={reset} disabled={disabled} className="font-medium text-[var(--color-gold-600)] hover:underline">Reset</button>
        )}
        {!drawing && path.length >= 4 && (
          <button type="button" onClick={() => onComplete(path.join("-"))} disabled={disabled} className="font-medium text-[var(--color-gold-600)] hover:underline">Done</button>
        )}
      </div>
    </div>
  );
}
