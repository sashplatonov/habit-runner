import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Placement = 'above' | 'below';

export function DescriptionTooltip({ description }: { description: string }) {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [placement, setPlacement] = useState<Placement>('above');
  const [anchor, setAnchor] = useState({ cx: 0, triggerTop: 0, triggerBottom: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const open = () => {
    if (!triggerRef.current) {
      return;
    }
    const r = triggerRef.current.getBoundingClientRect();
    setAnchor({ cx: r.left + r.width / 2, triggerTop: r.top, triggerBottom: r.bottom });
    setPlacement('above');
    setReady(false);
    setShow(true);
  };

  useLayoutEffect(() => {
    if (!show || !panelRef.current) {
      return;
    }
    const panelH = panelRef.current.offsetHeight;
    setPlacement(anchor.triggerTop - panelH - 10 < 12 ? 'below' : 'above');
    setReady(true);
  }, [show, anchor]);

  const panelWidth = typeof window !== 'undefined' ? Math.min(280, window.innerWidth - 24) : 280;
  const left = typeof window !== 'undefined'
    ? Math.max(panelWidth / 2 + 12, Math.min(anchor.cx, window.innerWidth - panelWidth / 2 - 12))
    : anchor.cx;
  const top = placement === 'above' ? anchor.triggerTop - 10 : anchor.triggerBottom + 10;
  const transform = placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center text-[9px] text-muted hover:text-foreground cursor-help font-mono w-4 h-4 rounded border border-dashed border-muted hover:border-foreground transition-colors flex-shrink-0"
        onMouseEnter={() => { open(); }}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); if (show) { setShow(false); } else { open(); } }}
        aria-label="Description"
      >
        ?
      </button>
      {show && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999]"
          style={{ left, top, transform, width: panelWidth, visibility: ready ? 'visible' : 'hidden' }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <div className="rounded-2xl border border-border/60 bg-bg-card shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-sm overflow-hidden">
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-[2px] w-8 rounded-full opacity-25 bg-foreground" />
            </div>
            <p className="px-3 pb-3 text-[11px] leading-[1.6] text-foreground whitespace-pre-wrap break-words">
              {description}
            </p>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              ...(placement === 'above'
                ? { bottom: 0, transform: 'translateX(-50%) translateY(100%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid color-mix(in srgb, var(--border) 60%, transparent)' }
                : { top: 0, transform: 'translateX(-50%) translateY(-100%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid color-mix(in srgb, var(--border) 60%, transparent)' }
              )
            }}
            aria-hidden
          />
        </div>,
        document.body
      )}
    </>
  );
}
