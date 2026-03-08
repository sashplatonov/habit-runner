import React from 'react';
import {
  LayoutDashboardIcon,
  BarChart2Icon,
  PlusIcon,
  LogOutIcon,
  PaletteIcon,
  MoonIcon,
  SunIcon
} from 'lucide-react';
import { THEMES, type ThemeId } from '@/hooks/useTheme';
import { Link, NavLink } from '@/lib/router';

interface NavProps {
  onLogout?: () => void;
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

export function Nav({ onLogout, theme, onThemeChange }: NavProps) {
  const darkThemes = THEMES.filter((t) => t.group === 'dark');
  const lightThemes = THEMES.filter((t) => t.group === 'light');

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-bg-primary/95 backdrop-blur-sm flex items-center px-4 justify-between"
      aria-label="Primary navigation"
    >
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 rounded border border-accent/40 flex items-center justify-center bg-accent/10">
          <span className="text-accent text-xs font-mono font-bold">HR</span>
        </div>
        <span className="text-foreground font-semibold text-sm tracking-tight hidden sm:block">
          Habbit Runner
        </span>
      </Link>

      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-lg p-1">
        <NavLink
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 text-muted hover:text-foreground"
          activeClassName="bg-accent/10 text-accent shadow-[0_0_12px_var(--glow)]"
        >
          <LayoutDashboardIcon size={13} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/stats"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 text-muted hover:text-foreground"
          activeClassName="bg-accent-secondary/10 text-accent-secondary shadow-[0_0_12px_var(--glow-secondary)]"
        >
          <BarChart2Icon size={13} />
          <span>Stats</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2">
        <div className="group relative">
          <button
            type="button"
            className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:border-border-hover transition-all duration-200"
            aria-label="Choose color theme"
            title="Choose color theme"
          >
            <PaletteIcon size={14} />
          </button>
          <div className="absolute right-0 top-full mt-2 w-36 bg-bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-1.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <MoonIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Dark</span>
            </div>
            {darkThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-mono transition-colors ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
                aria-label={`Switch to ${t.name} theme`}
              >
                <div className="flex gap-0.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.accent }}
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.accentSecondary }}
                  />
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
                onClick={() => onThemeChange(t.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-mono transition-colors ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
                aria-label={`Switch to ${t.name} theme`}
              >
                <div className="flex gap-0.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.accent }}
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.accentSecondary }}
                  />
                </div>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg border border-border text-muted hover:text-accent-secondary hover:border-accent-secondary/30 hover:bg-accent-secondary/10 transition-all duration-200"
            title="Clear all data"
            aria-label="Log out"
          >
            <LogOutIcon size={14} />
          </button>
        )}

        <Link
          to="/habit/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 hover:shadow-[0_0_16px_var(--glow)] transition-all duration-200"
        >
          <PlusIcon size={13} />
          <span className="hidden sm:block">New Habit</span>
        </Link>
      </div>
    </nav>
  );
}
