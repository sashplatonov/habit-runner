import { useCallback, useRef, useState, type TouchEvent } from 'react';

type SwipeDirection = 'left' | 'right' | 'none';

interface SwipeState {
  offset: number;
  direction: SwipeDirection;
  isSwiping: boolean;
}

type UseSwipeGestureOptions = {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

function detectHorizontalSwipe(dx: number, dy: number): boolean | null {
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
    return true;
  }
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
    return false;
  }
  return null;
}

function clampSwipeOffset(dx: number): number {
  return Math.max(-160, Math.min(160, dx));
}

function getSwipeDirection(offset: number): SwipeDirection {
  if (offset > 0) {
    return 'right';
  }
  if (offset < 0) {
    return 'left';
  }
  return 'none';
}

export function useSwipeGesture({
  threshold = 60,
  onSwipeLeft,
  onSwipeRight
}: UseSwipeGestureOptions = {}) {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const horizontalRef = useRef<boolean | null>(null);
  const triggeredRef = useRef(false);
  const [state, setState] = useState<SwipeState>({
    offset: 0,
    direction: 'none',
    isSwiping: false
  });

  const resetSwipe = useCallback(() => {
    startXRef.current = null;
    startYRef.current = null;
    horizontalRef.current = null;
    triggeredRef.current = false;
    setState((prev) =>
      prev.offset === 0 && !prev.isSwiping
        ? prev
        : { offset: 0, direction: 'none', isSwiping: false }
    );
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (startXRef.current === null || startYRef.current === null) {
        return;
      }

      const dx = clientX - startXRef.current;
      const dy = clientY - startYRef.current;

      if (horizontalRef.current === null) {
        horizontalRef.current = detectHorizontalSwipe(dx, dy);
        if (horizontalRef.current === false) {
          horizontalRef.current = false;
          resetSwipe();
          return;
        }
        if (horizontalRef.current === null) {
          return;
        }
      }

      if (!horizontalRef.current) {
        return;
      }

      const clamped = clampSwipeOffset(dx);
      const direction = getSwipeDirection(clamped);
      setState({ offset: clamped, direction, isSwiping: true });

      if (!triggeredRef.current && Math.abs(clamped) >= threshold) {
        triggeredRef.current = true;
        if (clamped > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
        setTimeout(resetSwipe, 150);
      }
    },
    [onSwipeLeft, onSwipeRight, resetSwipe, threshold]
  );

  const handlers = {
    onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        return;
      }
      const { clientX, clientY } = event.touches[0];
      startXRef.current = clientX;
      startYRef.current = clientY;
      horizontalRef.current = null;
      triggeredRef.current = false;
      setState({ offset: 0, direction: 'none', isSwiping: true });
    },
    onTouchMove(event: TouchEvent) {
      if (event.touches.length !== 1) {
        return;
      }
      handleMove(event.touches[0].clientX, event.touches[0].clientY);
    },
    onTouchEnd: resetSwipe,
    onTouchCancel: resetSwipe
  };

  return {
    handlers,
    ...state
  };
}
