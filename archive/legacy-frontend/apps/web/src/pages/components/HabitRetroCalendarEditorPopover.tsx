import React from 'react';
import type { HabitColorTheme } from '@/lib/theme/habit-colors';
import { POPOVER_WIDTH, POPOVER_HEIGHT } from './HabitRetroCalendar.constants';

export type RetroCalendarEditor = {
  date: string;
  pendingValue: number;
  anchorX: number;
  anchorY: number;
};

export type RetroCalendarEditorPopoverProps = {
  editor: RetroCalendarEditor;
  maxValue: number;
  accent: HabitColorTheme;
  onAdjust: (delta: number) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  onReset: () => Promise<void>;
};

function clampPopoverX(anchorX: number) {
  if (typeof window === 'undefined') {
    return anchorX;
  }
  const min = 12;
  const max = window.innerWidth - POPOVER_WIDTH - 12;
  return Math.min(Math.max(anchorX - POPOVER_WIDTH / 2, min), Math.max(min, max));
}

function clampPopoverY(anchorY: number) {
  if (typeof window === 'undefined') {
    return anchorY;
  }
  const min = 12;
  const max = window.innerHeight - POPOVER_HEIGHT - 12;
  return Math.min(Math.max(anchorY - POPOVER_HEIGHT - 16, min), Math.max(min, max));
}

export function RetroCalendarEditorPopover({
  editor,
  maxValue,
  accent,
  onAdjust,
  onClose,
  onSave,
  onReset
}: RetroCalendarEditorPopoverProps) {
  const left = clampPopoverX(editor.anchorX);
  const top = clampPopoverY(editor.anchorY);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[200px] rounded-2xl border border-border bg-bg-primary p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
        style={{ left, top }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono" style={{ color: accent.hex }}>
            {editor.date}
          </p>
          <button onClick={onClose} className="text-[12px] font-bold text-muted">×</button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            disabled={editor.pendingValue <= 0}
            className="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
          >–</button>
          <span className="text-sm font-semibold text-foreground">{editor.pendingValue}/{maxValue}</span>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            disabled={editor.pendingValue >= maxValue}
            className="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted"
          >+</button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => { void onSave(); }}
            className="flex-1 rounded-lg border border-border bg-accent/10 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
            style={{ boxShadow: `0 0 8px ${accent.glow}` }}
          >Save</button>
          <button
            type="button"
            onClick={() => { void onReset(); }}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover"
          >Reset</button>
        </div>
      </div>
    </>
  );
}

export default RetroCalendarEditorPopover;

