import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import { BarChart3Icon, CircleHelpIcon, Grid2x2Icon, TrendingUpIcon, XIcon } from 'lucide-react';

type ChartGuideVariant = 'bars' | 'line' | 'grid' | 'columns';

type ChartGuideTooltipProps = {
  title: string;
  summary: string;
  focusPoints: string[];
  variant?: ChartGuideVariant;
  triggerClassName?: string;
};

function GuideVisual({ variant }: { variant: ChartGuideVariant }) {
  if (variant === 'line') {
    return (
      <div className="relative h-20 overflow-hidden rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] px-3 py-2">
        <div className="absolute inset-x-0 bottom-2 h-px bg-border/60" />
        <svg viewBox="0 0 96 56" className="relative z-10 h-full w-full">
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="4,40 22,30 38,34 54,18 72,22 92,8"
          />
          {[['4', '40'], ['22', '30'], ['38', '34'], ['54', '18'], ['72', '22'], ['92', '8']].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="var(--bg-primary)" stroke="var(--accent)" strokeWidth="2" />
          ))}
        </svg>
        <div className="absolute left-3 top-3 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-accent">
          trend
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="grid h-20 grid-cols-5 gap-1 rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
        {[0.14, 0.22, 0.42, 0.78, 0.3, 0.24, 0.56, 0.92, 0.48, 0.18, 0.12, 0.66, 0.28, 0.84, 0.34, 0.16, 0.38, 0.7, 0.5, 0.2].map((opacity, index) => (
          <div
            key={index}
            className="rounded-[6px] bg-accent"
            style={{ opacity }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'columns') {
    return (
      <div className="flex h-20 items-end gap-1 rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
        {[24, 42, 32, 58, 50, 72, 46, 64].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-md bg-accent"
            style={{ height, opacity: 0.28 + index * 0.08 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-20 items-end gap-1 rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
      {[28, 44, 60, 38, 68].map((height, index) => (
        <div key={index} className="flex-1 rounded-t-md bg-accent" style={{ height, opacity: 0.35 + index * 0.1 }} />
      ))}
    </div>
  );
}

function renderVariantIcon(variant: ChartGuideVariant) {
  if (variant === 'line') {
    return <TrendingUpIcon size={14} />;
  }
  if (variant === 'grid') {
    return <Grid2x2Icon size={14} />;
  }
  return <BarChart3Icon size={14} />;
}

function useTooltipOverlay(open: boolean, closeTooltip: () => void) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) {
        return;
      }

      const viewportMargin = 12;
      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const maxLeft = Math.max(viewportMargin, window.innerWidth - panelRect.width - viewportMargin);
      const preferredLeft = triggerRect.right - panelRect.width;
      const left = Math.min(Math.max(viewportMargin, preferredLeft), maxLeft);

      let top = triggerRect.bottom + 10;
      if (top + panelRect.height > window.innerHeight - viewportMargin) {
        top = Math.max(viewportMargin, triggerRect.top - panelRect.height - 10);
      }

      setPosition((current) => {
        if (current.left === left && current.top === top) {
          return current;
        }
        return { left, top };
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      closeTooltip();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTooltip();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, closeTooltip]);

  return { triggerRef, panelRef, position };
}

function TooltipPanel({
  title,
  summary,
  focusPoints,
  variant,
  position,
  panelRef,
  closeTooltip
}: ChartGuideTooltipProps & {
  position: { left: number; top: number };
  panelRef: RefObject<HTMLDivElement | null>;
  closeTooltip: () => void;
}) {
  return (
    <div
      ref={panelRef}
      className="fixed z-[240] w-72 max-w-[calc(100vw-1.5rem)] rounded-3xl border border-border bg-bg-card p-3 text-left shadow-[0_18px_60px_rgba(0,0,0,0.32)]"
      style={{ left: position.left, top: position.top }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            {renderVariantIcon(variant ?? 'bars')}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-muted">Why it matters</p>
            <p className="truncate text-xs font-semibold text-foreground">{title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeTooltip}
          className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-bg-primary/70 text-muted transition-colors hover:border-border-hover hover:text-foreground"
          aria-label={`Close ${title} explanation`}
        >
          <XIcon size={14} />
        </button>
      </div>
      <GuideVisual variant={variant ?? 'bars'} />
      <p className="mt-3 text-[11px] leading-5 text-foreground">{summary}</p>
      <div className="mt-3 rounded-2xl border border-border bg-bg-primary/60 px-3 py-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-muted">Watch for</p>
        <div className="mt-2 space-y-1.5">
          {focusPoints.map((point) => (
            <div key={point} className="flex items-start gap-2 text-[10px] font-mono text-muted">
              <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChartGuideTooltip({
  title,
  summary,
  focusPoints,
  variant = 'bars',
  triggerClassName = ''
}: ChartGuideTooltipProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const open = isPinned || isHovered;
  const closeTooltip = useCallback(() => {
    setIsPinned(false);
    setIsHovered(false);
  }, []);
  const { triggerRef, panelRef, position } = useTooltipOverlay(open, closeTooltip);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Explain ${title}`}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setIsPinned((prev) => !prev); }}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setIsPinned(false);
          }
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
          open
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-border bg-bg-card text-muted hover:border-border-hover hover:text-foreground'
        } ${triggerClassName}`}
      >
        <CircleHelpIcon size={14} strokeWidth={2.1} />
      </button>
      {open ? createPortal(
        <TooltipPanel
          title={title}
          summary={summary}
          focusPoints={focusPoints}
          variant={variant}
          position={position}
          panelRef={panelRef}
          closeTooltip={closeTooltip}
        />,
        document.body
      ) : null}
    </div>
  );
}
