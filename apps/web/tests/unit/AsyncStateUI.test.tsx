import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// P3.1: AsyncStateUI component tests
// ---------------------------------------------------------------------------
import {
  PageLoadingSpinner,
  InlineLoader,
  ErrorCard,
  EmptyState
} from '@/components/AsyncStateUI';

describe('AsyncStateUI — PageLoadingSpinner', () => {
  it('renders with default label accessible to screen readers', () => {
    const { container } = render(<PageLoadingSpinner />);
    expect(container.querySelector('[role="status"]')).toBeDefined();
    expect(screen.getByText('Loading…')).toBeDefined();
  });

  it('accepts a custom label', () => {
    render(<PageLoadingSpinner label="Fetching habits…" />);
    expect(screen.getByText('Fetching habits…')).toBeDefined();
  });
});

describe('AsyncStateUI — InlineLoader', () => {
  it('has role status', () => {
    const { container } = render(<InlineLoader label="Saving…" />);
    expect(container.querySelector('[role="status"]')).toBeDefined();
    expect(screen.getByText('Saving…')).toBeDefined();
  });
});

describe('AsyncStateUI — ErrorCard', () => {
  it('renders error title and message', () => {
    render(<ErrorCard title="Oops" message="Network error" />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Oops')).toBeDefined();
    expect(screen.getByText('Network error')).toBeDefined();
  });

  it('shows retry button and calls onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorCard title="Fail" onRetry={onRetry} retryLabel="Retry" />);
    const btn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when onRetry not provided', () => {
    render(<ErrorCard title="Fail" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('AsyncStateUI — EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No habits yet"
        description="Create your first habit to get started."
      />
    );
    expect(screen.getByText('No habits yet')).toBeDefined();
    expect(screen.getByText(/Create your first habit/i)).toBeDefined();
  });

  it('renders an action slot', () => {
    render(
      <EmptyState
        title="Empty"
        action={<button type="button">Add habit</button>}
      />
    );
    expect(screen.getByRole('button', { name: /Add habit/i })).toBeDefined();
  });
});

