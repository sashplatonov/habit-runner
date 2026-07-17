import { describe, expect, it } from 'vitest';
import { calculateTooltipPosition } from '$lib/components/overlays/tooltipPosition';

describe('calculateTooltipPosition', () => {
  it('keeps a tooltip near the right edge inside the viewport', () => {
    const position = calculateTooltipPosition({
      viewportWidth: 1024,
      viewportHeight: 768,
      triggerLeft: 990,
      triggerRight: 1006,
      triggerTop: 400,
      triggerBottom: 416,
      contentHeight: 180
    });

    expect(position.left).toBeGreaterThanOrEqual(12);
    expect(position.left + position.width).toBeLessThanOrEqual(1012);
  });

  it('moves a tall tooltip above a low trigger and constrains its height', () => {
    const position = calculateTooltipPosition({
      viewportWidth: 900,
      viewportHeight: 600,
      triggerLeft: 420,
      triggerRight: 436,
      triggerTop: 540,
      triggerBottom: 556,
      contentHeight: 900
    });

    expect(position.placement).toBe('above');
    expect(position.top).toBeGreaterThanOrEqual(12);
    expect(position.top + position.maxHeight).toBeLessThanOrEqual(530);
  });

  it('places the tooltip below when the trigger is close to the top', () => {
    const position = calculateTooltipPosition({
      viewportWidth: 900,
      viewportHeight: 600,
      triggerLeft: 420,
      triggerRight: 436,
      triggerTop: 20,
      triggerBottom: 36,
      contentHeight: 200
    });

    expect(position.placement).toBe('below');
    expect(position.top).toBe(46);
    expect(position.top + position.maxHeight).toBeLessThanOrEqual(588);
  });
});
