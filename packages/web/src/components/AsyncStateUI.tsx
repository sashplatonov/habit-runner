import React from 'react';

// ---------------------------------------------------------------------------
// Shared async UI state primitives — P1.2 standardisation
// ---------------------------------------------------------------------------
// Use these building blocks instead of writing ad-hoc loading/error/empty UI.

/** Full-height loading spinner overlay — for initial page load */
export function PageLoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="min-h-[200px] flex flex-col items-center justify-center gap-3 py-12"
      role="status"
      aria-label={label}
    >
      <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Inline loading indicator — for secondary data inside a page */
export function InlineLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted font-mono py-2" role="status">
      <div className="w-3 h-3 rounded-full border border-accent/30 border-t-accent animate-spin" />
      <span>{label}</span>
    </div>
  );
}

/** Error state card with optional retry action */
export function ErrorCard({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again'
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 space-y-2"
      role="alert"
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {message && (
        <p className="text-xs font-mono text-muted break-words">{message}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-xs font-semibold text-accent hover:underline"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

/** Empty-state placeholder with icon slot */
export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
      {icon && (
        <div className="text-muted/40 mb-1" aria-hidden>
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

