import React from 'react';
import { SidebarNav } from './SidebarNav';
import type { SyncEngineState } from '@/hooks/useSyncEngine';
import { BottomNav } from './BottomNav';
import type { ThemeId } from '@/hooks/useTheme';

interface AppLayoutProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onLogout?: () => void | Promise<void>;
  children: React.ReactNode;
  syncState?: SyncEngineState;
}

export function AppLayout({ theme, onThemeChange, onLogout, children, syncState }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Skip navigation link — visible on focus for keyboard users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-bg-primary focus:font-semibold focus:text-sm focus:shadow-lg"
      >
        Skip to main content
      </a>
      <SidebarNav theme={theme} onThemeChange={onThemeChange} onLogout={onLogout} syncState={syncState} />
      <div className="sm:ml-[220px]">
        <main
          id="main-content"
          tabIndex={-1}
          className="focus:outline-none sm:!pb-0"
          style={{
            paddingTop: 'var(--safe-area-inset-top, 0px)',
            paddingBottom: 'calc(72px + var(--safe-area-inset-bottom, 0px))'
          }}
        >
          {children}
        </main>
        <footer className="py-4 text-center">
          <span className="text-[11px] font-mono text-muted/30 select-none">
            {new Date(__BUILD_TIME__).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
            })}
          </span>
        </footer>
      </div>
      <BottomNav theme={theme} onThemeChange={onThemeChange} onLogout={onLogout} />
    </div>
  );
}
