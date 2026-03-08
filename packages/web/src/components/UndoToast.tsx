import React from 'react';

interface Props {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
}

export function UndoToast({ message, actionLabel, onAction, onClose }: Props) {
  return (
    <div className="fixed left-1/2 bottom-6 z-50 w-full max-w-lg -translate-x-1/2 bg-bg-secondary/90 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between gap-4 text-sm text-foreground">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted">undo</p>
        <p className="mt-1 text-base font-semibold">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition hover:border-accent-secondary/60"
          onClick={onAction}
        >
          {actionLabel}
        </button>
        <button
          type="button"
          className="text-xs font-mono uppercase tracking-[0.3em] text-muted"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
}
