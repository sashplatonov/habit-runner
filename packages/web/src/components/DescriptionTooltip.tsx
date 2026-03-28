import { useRef, useState } from 'react';

export function DescriptionTooltip({ description }: { description: string }) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const handleEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ left: rect.left + rect.width / 2, top: rect.top - 8 });
    }
    setShow(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center text-[9px] text-muted hover:text-foreground cursor-help font-mono w-4 h-4 rounded border border-dashed border-muted hover:border-foreground transition-colors flex-shrink-0"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); }}
        aria-label="Описание"
      >
        ?
      </button>
      {show && (
        <div
          className="fixed bg-bg-card border border-border rounded-lg p-2 text-[11px] text-foreground shadow-lg z-[9999] whitespace-pre-wrap break-words max-h-40 overflow-auto"
          style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -100%)', width: '220px' }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {description}
        </div>
      )}
    </>
  );
}
