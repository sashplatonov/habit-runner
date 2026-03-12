import React, { useRef, useState } from 'react';
import {
  LayoutDashboardIcon,
  BarChart2Icon,
  PlusIcon,
  PaletteIcon,
  SearchIcon,
  MoonIcon,
  SunIcon
} from 'lucide-react';
import { Link, useLocation } from '@/lib/router';
import { THEMES, type ThemeId } from '@/hooks/useTheme';

interface BottomNavProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

export function BottomNav({ theme, onThemeChange }: BottomNavProps) {
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const darkThemes = THEMES.filter((t) => t.group === 'dark');
  const lightThemes = THEMES.filter((t) => t.group === 'light');

  const isHome = location.pathname === '/';
  const isStats = location.pathname === '/stats';

  React.useEffect(() => {
    if (!isThemeOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isThemeOpen]);

  return (
    <nav
      className="flex sm:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-bg-primary/95 border-t border-border backdrop-blur-sm z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      {/* Dashboard */}
      <Link
        to="/"
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isHome ? 'text-accent' : 'text-muted'}`}
        aria-label="Dashboard"
      >
        <div className={`w-8 h-8 flex items-center justify-center rounded-[10px] ${isHome ? 'bg-accent/10' : ''}`}>
          <LayoutDashboardIcon size={18} />
        </div>
        <span className="text-[10px] font-medium">Dashboard</span>
      </Link>

      {/* Stats */}
      <Link
        to="/stats"
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isStats ? 'text-accent' : 'text-muted'}`}
        aria-label="Stats"
      >
        <div className={`w-8 h-8 flex items-center justify-center rounded-[10px] ${isStats ? 'bg-accent/10' : ''}`}>
          <BarChart2Icon size={18} />
        </div>
        <span className="text-[10px] font-medium">Stats</span>
      </Link>

      {/* FAB */}
      <div className="flex-[0_0_72px] flex items-center justify-center">
        <Link
          to="/habit/new"
          className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-bg-primary bg-accent"
          style={{ boxShadow: '0 0 20px var(--glow), 0 8px 16px rgba(0,0,0,0.4)' }}
          aria-label="New habit"
        >
          <PlusIcon size={24} />
        </Link>
      </div>

      {/* Search — placeholder */}
      <button
        type="button"
        disabled
        className="flex-1 flex flex-col items-center justify-center gap-1 text-muted opacity-40"
        aria-label="Search (coming soon)"
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-[10px]">
          <SearchIcon size={18} />
        </div>
        <span className="text-[10px] font-medium">Search</span>
      </button>

      {/* Theme */}
      <div ref={themeRef} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
        <button
          type="button"
          onClick={() => setIsThemeOpen((prev) => !prev)}
          className={`flex flex-col items-center gap-1 ${isThemeOpen ? 'text-accent' : 'text-muted'}`}
          aria-label="Choose theme"
        >
          <div className={`w-8 h-8 flex items-center justify-center rounded-[10px] ${isThemeOpen ? 'bg-accent/10' : ''}`}>
            <PaletteIcon size={18} />
          </div>
          <span className="text-[10px] font-medium">Theme</span>
        </button>

        {isThemeOpen && (
          <div className="absolute bottom-[72px] right-0 w-44 bg-bg-card border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-0.5 z-10">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <MoonIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Dark</span>
            </div>
            {darkThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onThemeChange(t.id); setIsThemeOpen(false); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
              >
                <div className="flex gap-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accentSecondary }} />
                </div>
                {t.name}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center gap-1.5 px-2 py-1">
              <SunIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Light</span>
            </div>
            {lightThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onThemeChange(t.id); setIsThemeOpen(false); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
              >
                <div className="flex gap-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accentSecondary }} />
                </div>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
