type SwipeGestureOptions = {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function swipeGesture(node: HTMLElement, options: SwipeGestureOptions = {}) {
  const { threshold = 60, onSwipeLeft, onSwipeRight } = options;

  let startX: number | null = null;
  let startY: number | null = null;
  let isHorizontal: boolean | null = null;
  let triggered = false;

  function reset() {
    startX = null;
    startY = null;
    isHorizontal = null;
    triggered = false;
  }

  function detectHorizontal(dx: number, dy: number): boolean | null {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { return true; }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { return false; }
    return null;
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) { return; }
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    isHorizontal = null;
    triggered = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (startX === null || startY === null || triggered) { return; }
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (isHorizontal === null) {
      isHorizontal = detectHorizontal(dx, dy);
      if (isHorizontal === false) {
        reset();
        return;
      }
      if (isHorizontal === null) {
        return;
      }
    }

    if (!isHorizontal) {
      return;
    }

    const clamped = Math.max(-160, Math.min(160, dx));
    if (Math.abs(clamped) >= threshold) {
      triggered = true;
      if (clamped > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
      setTimeout(reset, 150);
    }
  }

  function onTouchEnd() {
    reset();
  }

  node.addEventListener('touchstart', onTouchStart, { passive: true });
  node.addEventListener('touchmove', onTouchMove, { passive: true });
  node.addEventListener('touchend', onTouchEnd, { passive: true });

  return {
    update(newOptions: SwipeGestureOptions) {
      Object.assign(options, newOptions);
    },
    destroy() {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
    }
  };
}
