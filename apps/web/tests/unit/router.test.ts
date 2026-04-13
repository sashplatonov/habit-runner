import { describe, expect, it, vi } from 'vitest';
import { invokeIfFunction } from '@/lib/callback';

describe('invokeIfFunction', () => {
  it('calls handler when value is function', () => {
    const handler = vi.fn();
    const arg = { type: 'click' };

    invokeIfFunction(handler, arg);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(arg);
  });

  it('does not throw when value is truthy but not a function', () => {
    expect(() => invokeIfFunction(true, { type: 'click' })).not.toThrow();
    expect(() => invokeIfFunction('click', { type: 'click' })).not.toThrow();
    expect(() => invokeIfFunction(1, { type: 'click' })).not.toThrow();
  });
});
