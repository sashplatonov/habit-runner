import React, { useEffect, useMemo, useRef, useState } from 'react';

const PULL_TRIGGER_PX = 72;
const MAX_PULL_PX = 112;
const PULL_DAMPING = 0.45;

type PullToRefreshProps = {
  enabled?: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
};

type PullState = 'idle' | 'pull' | 'armed' | 'refreshing';

function usePullGesture(enabled: boolean, isRefreshing: boolean, onRefresh: () => Promise<void>) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const armedRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setPullDistance(0);
    }
  }, [enabled]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) {
      return;
    }

    const reset = () => {
      startYRef.current = null;
      activeRef.current = false;
      armedRef.current = false;
      setPullDistance(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshing || event.touches.length !== 1 || window.scrollY > 0) {
        reset();
        return;
      }
      startYRef.current = event.touches[0].clientY;
      activeRef.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!activeRef.current || startYRef.current === null || event.touches.length !== 1) {
        return;
      }

      const deltaY = event.touches[0].clientY - startYRef.current;
      if (deltaY <= 0 || window.scrollY > 0) {
        reset();
        return;
      }

      const nextDistance = Math.min(MAX_PULL_PX, deltaY * PULL_DAMPING);
      armedRef.current = nextDistance >= PULL_TRIGGER_PX;
      setPullDistance(nextDistance);
      event.preventDefault();
    };

    const handleTouchEnd = () => {
      if (!activeRef.current) {
        return;
      }
      const shouldRefresh = armedRef.current && !isRefreshing;
      reset();
      if (shouldRefresh) {
        void onRefresh();
      }
    };

    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: false });
    root.addEventListener('touchend', handleTouchEnd);
    root.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
      root.removeEventListener('touchend', handleTouchEnd);
      root.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, isRefreshing, onRefresh]);

  return { rootRef, pullDistance };
}

function PullIndicator({ isRefreshing, pullDistance }: { isRefreshing: boolean; pullDistance: number }) {
  const pullState: PullState = useMemo(() => {
    if (isRefreshing) {
      return 'refreshing';
    }
    if (pullDistance >= PULL_TRIGGER_PX) {
      return 'armed';
    }
    if (pullDistance > 0) {
      return 'pull';
    }
    return 'idle';
  }, [isRefreshing, pullDistance]);

  const message =
    pullState === 'refreshing'
      ? 'Syncing data...'
      : pullState === 'armed'
        ? 'Release to refresh'
        : 'Pull down to refresh';
  const indicatorVisible = pullState !== 'idle';
  const progress = Math.min(1, pullDistance / PULL_TRIGGER_PX);

  return (
    <>
      <div
        aria-hidden={!indicatorVisible}
        className={`pointer-events-none fixed left-1/2 z-40 -translate-x-1/2 transition-all duration-200 ${
          indicatorVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          top: 'calc(var(--safe-area-inset-top, 0px) + 0.75rem)',
          transform: `translateX(-50%) translateY(${indicatorVisible ? 0 : -12}px)`
        }}
      >
        <div className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-accent/30 bg-bg-card/95 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full border border-accent/40 ${
              isRefreshing ? 'animate-pulse bg-accent' : 'bg-accent/20'
            }`}
            style={{
              boxShadow: isRefreshing ? '0 0 10px var(--glow)' : 'none',
              transform: `scale(${0.8 + progress * 0.35})`
            }}
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">{message}</span>
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {indicatorVisible ? message : ''}
      </div>
    </>
  );
}

export function PullToRefresh({
  enabled = true,
  isRefreshing,
  onRefresh,
  children
}: PullToRefreshProps) {
  const { rootRef, pullDistance } = usePullGesture(enabled, isRefreshing, onRefresh);

  return (
    <div ref={rootRef} className="relative min-h-screen">
      <PullIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />
      {children}
    </div>
  );
}
