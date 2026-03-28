import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function DescriptionTooltip({ description }: { description: string }) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const computePos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ left: rect.left + rect.width / 2, top: rect.top - 10 });
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center text-[9px] text-muted hover:text-foreground cursor-help font-mono w-4 h-4 rounded border border-dashed border-muted hover:border-foreground transition-colors flex-shrink-0"
        onMouseEnter={() => { computePos(); setShow(true); }}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); computePos(); setShow(v => !v); }}
        aria-label="Описание"
      >
        ?
      </button>
      {show && createPortal(
        <div
          className="fixed z-[9999] max-w-xs"
          style={{
            left: pos.left,
            top: pos.top,
            transform: 'translate(-50%, -100%)',
            width: 'min(280px, calc(100vw - 24px))'
          }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <div className="rounded-2xl border border-border/60 bg-bg-card shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-sm overflow-hidden">
            <div className="px-1 py-1">
              <div className="h-[2px] w-8 rounded-full mx-auto mb-2 opacity-30 bg-foreground" />
            </div>
            <p className="px-3 pb-3 text-[11px] leading-[1.6] text-foreground whitespace-pre-wrap break-words">
              {description}
            </p>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--border)'
            }}
            aria-hidden
          />
        </div>,
        document.body
      )}
    </>
  );
}
