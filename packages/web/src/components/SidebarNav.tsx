import React, { useRef, useState } from 'react';
import {
  LayoutDashboardIcon,
  BarChart2Icon,
  PlusIcon,
  PaletteIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon
} from 'lucide-react';
import { NavLink, Link } from '@/lib/router';
import { THEMES, type ThemeId } from '@/hooks/useTheme';

interface SidebarNavProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onLogout?: () => void | Promise<void>;
}

function ThemeDropdown({ theme, onThemeChange }: { theme: ThemeId; onThemeChange: (id: ThemeId) => void }) {
  const darkThemes = THEMES.filter((t) => t.group === 'dark');
  const lightThemes = THEMES.filter((t) => t.group === 'light');
  const btn = `flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors`;

  const renderTheme = (t: (typeof THEMES)[number]) => (
    <button
      key={t.id}
      type="button"
      onClick={() => onThemeChange(t.id)}
      className={`${btn} ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
      aria-label={`Switch to ${t.name} theme`}
    >
      <div className="flex gap-0.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accentSecondary }} />
      </div>
      {t.name}
    </button>
  );

  return (
    <div className="absolute left-0 bottom-full mb-1 w-full bg-bg-card border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 z-10">
      <div className="flex items-center gap-1.5 px-2 py-1">
        <MoonIcon size={10} className="text-muted" />
        <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Dark</span>
      </div>
      {darkThemes.map(renderTheme)}
      <div className="h-px bg-border my-1" />
      <div className="flex items-center gap-1.5 px-2 py-1">
        <SunIcon size={10} className="text-muted" />
        <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Light</span>
      </div>
      {lightThemes.map(renderTheme)}
    </div>
  );
}

export function SidebarNav({ theme, onThemeChange, onLogout }: SidebarNavProps) {
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isThemeOpen) { return; }
    const handleClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isThemeOpen]);

  return (
    <aside
      className="hidden sm:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-bg-primary border-r border-border px-3 py-4 z-50"
      style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 1rem)' }}
      aria-label="Sidebar navigation"
    >
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-xs font-mono font-bold">HR</span>
        </div>
        <span className="text-sm font-bold tracking-tight">Habbit Runner</span>
      </Link>

      <Link
        to="/habit/new"
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 hover:shadow-[0_0_16px_var(--glow)] transition-all duration-200 mb-4"
      >
        <PlusIcon size={16} />
        New Habit
      </Link>

      <div className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">Navigate</div>
      <nav className="flex flex-col gap-0.5">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-bg-secondary transition-all duration-200"
          activeClassName="bg-accent/10 text-accent"
        >
          <LayoutDashboardIcon size={16} />
          Dashboard
        </NavLink>
        <NavLink
          to="/stats"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-bg-secondary transition-all duration-200"
          activeClassName="bg-accent-secondary/10 text-accent-secondary"
        >
          <BarChart2Icon size={16} />
          Stats
        </NavLink>
      </nav>

      <div className="flex-1" />

      <div className="border-t border-border pt-3">
        <div className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">Appearance</div>
        <div ref={themeRef} className="relative">
          <button
            type="button"
            onClick={() => setIsThemeOpen((prev) => !prev)}
            className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isThemeOpen ? 'bg-bg-secondary text-foreground' : 'text-muted hover:text-foreground hover:bg-bg-secondary'}`}
            aria-label="Choose color theme"
          >
            <PaletteIcon size={16} />
            <span className="flex-1 text-left capitalize">{theme}</span>
            <span className="text-[10px] opacity-50">{isThemeOpen ? '▲' : '▼'}</span>
          </button>
          {isThemeOpen && <ThemeDropdown theme={theme} onThemeChange={onThemeChange} />}
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-accent-secondary hover:bg-accent-secondary/10 transition-all duration-200 mt-0.5"
            aria-label="Log out"
          >
            <LogOutIcon size={16} />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
