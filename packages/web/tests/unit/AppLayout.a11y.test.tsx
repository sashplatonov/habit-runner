import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// P3.1: AppLayout a11y tests — skip-link and landmark structure
// ---------------------------------------------------------------------------

// Stub out child components that have complex deps (Dexie, sync engine, etc.)
vi.mock('@/components/SidebarNav', () => ({
  SidebarNav: () => <nav aria-label="Sidebar navigation" data-testid="sidebar" />
}));
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <nav aria-label="Mobile navigation" data-testid="bottom-nav" />
}));

import { AppLayout } from '@/components/AppLayout';

// Vitest global declares __BUILD_TIME__; set it to a numeric value for testing
(globalThis as Record<string, unknown>).__BUILD_TIME__ = Date.now();

const theme = 'dark' as const;

describe('AppLayout — accessibility', () => {
  it('renders a skip-to-main-content link', () => {
    render(
      <AppLayout theme={theme} onThemeChange={vi.fn()}>
        <p>content</p>
      </AppLayout>
    );
    const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('main element has correct id for skip-link target', () => {
    const { container } = render(
      <AppLayout theme={theme} onThemeChange={vi.fn()}>
        <p>content</p>
      </AppLayout>
    );
    const main = container.querySelector('#main-content');
    expect(main).toBeDefined();
    expect(main?.tagName.toLowerCase()).toBe('main');
  });

  it('renders children inside main', () => {
    render(
      <AppLayout theme={theme} onThemeChange={vi.fn()}>
        <p data-testid="child">Hello world</p>
      </AppLayout>
    );
    const main = screen.getByRole('main');
    expect(main.querySelector('[data-testid="child"]')).toBeDefined();
  });
});

