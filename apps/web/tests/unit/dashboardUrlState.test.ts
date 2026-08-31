import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReplaceState } = vi.hoisted(() => ({ mockReplaceState: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ replaceState: mockReplaceState }));

import { updateDashboardURL } from '$lib/dashboard/urlState';

describe('dashboard URL state', () => {
  beforeEach(() => {
    mockReplaceState.mockReset();
    window.history.replaceState({}, '', '/showcase?filter=done&tags=focus');
  });

  it('uses shallow history replacement when a dashboard filter changes', () => {
    updateDashboardURL({ filter: 'all' });

    expect(mockReplaceState).toHaveBeenCalledWith('/showcase?filter=all&tags=focus', {});
  });

  it('removes an explicitly reset default filter from the URL', () => {
    updateDashboardURL({ filter: undefined });

    expect(mockReplaceState).toHaveBeenCalledWith('/showcase?tags=focus', {});
  });
});
