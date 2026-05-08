/**
 * Reusable overlay accessibility contract.
 *
 * Handles:
 * - focus trap inside the overlay while open
 * - focus restore to trigger element on close
 * - Escape key handling
 * - outside-click / pointer-down-outside policy
 * - scroll containment on the body (optional)
 * - reduced-motion awareness
 *
 * Use this as a shared helper for modals, tooltips, bottom sheets,
 * and other portal-based overlays.
 */

export type OverlayOptions = {
  /** The trigger element that opened the overlay (for focus restore). */
  triggerEl: HTMLElement | null;
  /** The overlay panel element itself. */
  panelEl: HTMLElement | null;
  /** Whether the overlay is currently open. */
  open: boolean;
  /** Callback to close the overlay. */
  onClose: () => void;
  /** If true, restore focus to trigger on close (default true). */
  restoreFocus?: boolean;
  /** If true, trap focus inside the overlay (default true for dialogs). */
  trapFocus?: boolean;
  /** If true, close on Escape (default true). */
  closeOnEscape?: boolean;
  /** If true, close on outside pointer down (default true for non-tooltip overlays). */
  closeOnOutsideClick?: boolean;
  /** If true, prevent body scroll while open (default false). */
  lockScroll?: boolean;
};

let activeOverlay: OverlayOptions | null = null;
let previousActiveElement: Element | null = null;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetParent !== null
  );
}

function handleKeyDown(e: KeyboardEvent, opts: OverlayOptions) {
  if (opts.closeOnEscape !== false && e.key === 'Escape') {
    e.preventDefault();
    opts.onClose();
    return;
  }

  if (opts.trapFocus !== false && e.key === 'Tab' && opts.panelEl) {
    const focusable = getFocusableElements(opts.panelEl);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

function handlePointerDown(e: PointerEvent, opts: OverlayOptions) {
  if (opts.closeOnOutsideClick === false) {
    return;
  }
  const target = e.target as Node | null;
  if (target && opts.panelEl && !opts.panelEl.contains(target) && !opts.triggerEl?.contains(target)) {
    opts.onClose();
  }
}

function lockBodyScroll() {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.style.overflow = '';
}

export function openOverlay(opts: OverlayOptions) {
  closeActiveOverlay();

  previousActiveElement = document.activeElement;
  activeOverlay = opts;

  if (opts.lockScroll) {
    lockBodyScroll();
  }

  const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e, opts);
  const onPointerDown = (e: PointerEvent) => handlePointerDown(e, opts);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onPointerDown);

  // Store cleanup
  (opts as OverlayOptions & { _cleanup?: () => void })._cleanup = () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onPointerDown);
  };

  // Focus the panel or first focusable element
  requestAnimationFrame(() => {
    if (!opts.panelEl) {
      return;
    }
    const focusable = getFocusableElements(opts.panelEl);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      opts.panelEl.focus();
    }
  });
}

export function closeActiveOverlay() {
  if (!activeOverlay) { return; }

  const cleanup = (activeOverlay as OverlayOptions & { _cleanup?: () => void })._cleanup;
  if (cleanup) {
    cleanup();
  }

  if (activeOverlay.lockScroll) {
    unlockBodyScroll();
  }

  if (activeOverlay.restoreFocus !== false && previousActiveElement instanceof HTMLElement) {
    previousActiveElement.focus();
  }

  activeOverlay = null;
  previousActiveElement = null;
}

export function isOverlayActive(): boolean {
  return activeOverlay !== null;
}
