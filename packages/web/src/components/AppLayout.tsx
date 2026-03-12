import React from 'react';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import type { ThemeId } from '@/hooks/useTheme';

interface AppLayoutProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onLogout?: () => void | Promise<void>;
  children: React.ReactNode;
}

export function AppLayout({ theme, onThemeChange, onLogout, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <SidebarNav theme={theme} onThemeChange={onThemeChange} onLogout={onLogout} />
      <div className="sm:ml-[220px]">
        <main
          id="main-content"
          tabIndex={-1}
          className="focus:outline-none pb-[72px] sm:pb-0"
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
      <BottomNav theme={theme} onThemeChange={onThemeChange} />
    </div>
  );
}
