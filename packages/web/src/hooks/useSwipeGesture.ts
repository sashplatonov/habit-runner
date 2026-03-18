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
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
          horizontalRef.current = true;
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          horizontalRef.current = false;
          resetSwipe();
          return;
        } else {
          return;
        }
      }

      if (!horizontalRef.current) {
        return;
      }

      const clamped = Math.max(-160, Math.min(160, dx));
      const direction: SwipeDirection = clamped > 0 ? 'right' : clamped < 0 ? 'left' : 'none';
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
