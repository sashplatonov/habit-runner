import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicNav from '$lib/components/PublicNav.svelte';

const startOAuthLogin = vi.fn();

vi.mock('$lib/auth/oauth', () => ({
  startOAuthLogin
}));

vi.mock('$app/paths', () => ({
  resolve: (route: string, params?: Record<string, string>) => {
    if (!params) {
      return route;
    }

    return Object.entries(params).reduce(
      (resolvedRoute, [key, value]) => resolvedRoute.replace(`[${key}]`, value),
      route
    );
  }
}));

vi.mock('$app/state', () => ({
  page: {
    url: new URL('https://example.test/')
  }
}));

describe('PublicNav', () => {
  beforeEach(() => {
    startOAuthLogin.mockReset();
  });

  it('starts OAuth when the default Get Started CTA is clicked', async () => {
    const user = userEvent.setup();

    render(PublicNav);

    await user.click(screen.getByRole('button', { name: 'Get Started' }));

    expect(startOAuthLogin).toHaveBeenCalledTimes(1);
  });
});
