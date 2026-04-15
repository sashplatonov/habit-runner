import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncStatus } from '@/components/SyncStatus';

describe('SyncStatus', () => {
  it('renders synced state', () => {
    render(
      <SyncStatus
        syncState={{ status: 'idle', pending: 0, conflicts: 0, syncNow: async () => {} }}
      />
    );
    expect(screen.getAllByText(/Synced/i).length).toBeGreaterThan(0);
  });

  it('renders syncing state and retry button calls syncNow', async () => {
    const mockSync = vi.fn(async () => {});
    render(
      <SyncStatus
        syncState={{ status: 'syncing', pending: 2, conflicts: 0, syncNow: mockSync }}
      />
    );
    expect(screen.getAllByText(/Syncing/i).length).toBeGreaterThan(0);
    const btn = screen.getByRole('button', { name: /Retry sync now/i });
    fireEvent.click(btn);
    expect(mockSync).toHaveBeenCalled();
  });

  it('shows error message when lastError present', () => {
    render(
      <SyncStatus
        syncState={{
          status: 'error',
          pending: 1,
          conflicts: 0,
          lastError: 'boom',
          syncNow: async () => {}
        }}
      />
    );
    expect(screen.getAllByText(/Sync error/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/boom/i)).toBeDefined();
  });
});

