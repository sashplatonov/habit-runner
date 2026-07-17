import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeActiveOverlay, openOverlay } from '../../src/lib/components/overlays/overlayManager.js';

describe('overlayManager', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    closeActiveOverlay();
    document.body.style.overflow = '';
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('focuses the first eligible control and restores the prior body overflow', () => {
    const trigger = document.createElement('button');
    const panel = document.createElement('div');
    panel.tabIndex = -1;
    const ignoredBackdrop = document.createElement('button');
    ignoredBackdrop.tabIndex = -1;
    const closeButton = document.createElement('button');
    panel.append(ignoredBackdrop, closeButton);
    document.body.append(trigger, panel);
    Object.defineProperty(closeButton, 'offsetParent', { value: panel });
    document.body.style.overflow = 'clip';
    trigger.focus();

    openOverlay({
      triggerEl: trigger,
      panelEl: panel,
      open: true,
      onClose: vi.fn(),
      lockScroll: true
    });

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(closeButton);

    closeActiveOverlay();

    expect(document.body.style.overflow).toBe('clip');
    expect(document.activeElement).toBe(trigger);
  });
});
