export type SwipeDirection = 'left' | 'right' | 'none';

export interface SwipeState {
  offset: number;
  direction: SwipeDirection;
  isSwiping: boolean;
}

type SwipeGestureOptions = {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onStateChange?: (state: SwipeState) => void;
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
  if (offset > 0) return 'right';
  if (offset < 0) return 'left';
  return 'none';
}

export function swipeGesture(node: HTMLElement, options: SwipeGestureOptions = {}) {
  let startX: number | null = null;
  let startY: number | null = null;
  let horizontal: boolean | null = null;
  let triggered = false;
  let { threshold = 60, onSwipeLeft, onSwipeRight, onStateChange } = options;

  function emit(state: SwipeState) {
    onStateChange?.(state);
  }

  function reset() {
    startX = null;
    startY = null;
    horizontal = null;
    triggered = false;
    emit({ offset: 0, direction: 'none', isSwiping: false });
  }

  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return;
    const { clientX, clientY } = event.touches[0];
    startX = clientX;
    startY = clientY;
    horizontal = null;
    triggered = false;
    emit({ offset: 0, direction: 'none', isSwiping: true });
  }

  function handleTouchMove(event: TouchEvent) {
    if (event.touches.length !== 1 || startX === null || startY === null) return;
    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;

    if (horizontal === null) {
      horizontal = detectHorizontalSwipe(dx, dy);
      if (horizontal === false) {
        reset();
        return;
      }
      if (horizontal === null) return;
    }

    if (!horizontal) return;

    const clamped = clampSwipeOffset(dx);
    const direction = getSwipeDirection(clamped);
    emit({ offset: clamped, direction, isSwiping: true });

    if (!triggered && Math.abs(clamped) >= threshold) {
      triggered = true;
      if (clamped > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
      setTimeout(reset, 150);
    }
  }

  node.addEventListener('touchstart', handleTouchStart, { passive: true });
  node.addEventListener('touchmove', handleTouchMove, { passive: true });
  node.addEventListener('touchend', reset);
  node.addEventListener('touchcancel', reset);

  return {
    update(newOptions: SwipeGestureOptions) {
      threshold = newOptions.threshold ?? 60;
      onSwipeLeft = newOptions.onSwipeLeft;
      onSwipeRight = newOptions.onSwipeRight;
      onStateChange = newOptions.onStateChange;
    },
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', reset);
      node.removeEventListener('touchcancel', reset);
    }
  };
}
