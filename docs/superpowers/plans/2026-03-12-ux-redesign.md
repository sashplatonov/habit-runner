# UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace top navbar with platform-specific navigation (sidebar on desktop, bottom tab bar on mobile), add habit card accent borders, update dashboard hero, and switch font to Sora.

**Architecture:** New `AppLayout` component wraps all authenticated content, rendering `SidebarNav` on desktop and `BottomNav` on mobile. `Nav.tsx` is deleted. Visual changes to `DashboardHero` and `HabitRow` are isolated to their respective files.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Vite

**Spec:** `docs/superpowers/specs/2026-03-12-ux-redesign-design.md`

---

## Chunk 1: Foundation — Font + New Nav Components

### Task 1: Font — Inter → Sora

**Files:**
- Modify: `packages/web/index.html:17`
- Modify: `packages/web/tailwind.config.js:22`
- Modify: `packages/web/src/index.css` (body font-family if hardcoded)

- [ ] **Step 1: Update Google Fonts URL in index.html**

In `packages/web/index.html`, replace the Google Fonts stylesheet link (line 15-18):
```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap"
/>
```
(Keep JetBrains Mono, replace Inter with Sora)

- [ ] **Step 2: Update tailwind.config.js**

In `packages/web/tailwind.config.js`, change line 22:
```js
sans: ['Sora', 'sans-serif']
```

- [ ] **Step 3: Check and update index.css**

In `packages/web/src/index.css`, find any hardcoded `font-family: 'Inter'` in `body {}` and replace with `'Sora', sans-serif`.

- [ ] **Step 4: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/index.html packages/web/tailwind.config.js packages/web/src/index.css
git commit -m "feat(web): replace Inter with Sora font"
```

---

### Task 2: Create BottomNav.tsx

**Files:**
- Create: `packages/web/src/components/BottomNav.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/components/BottomNav.tsx
git commit -m "feat(web): add mobile BottomNav with FAB and theme picker"
```

---

### Task 3: Create SidebarNav.tsx

**Files:**
- Create: `packages/web/src/components/SidebarNav.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from 'react';
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

export function SidebarNav({ theme, onThemeChange, onLogout }: SidebarNavProps) {
  const darkThemes = THEMES.filter((t) => t.group === 'dark');
  const lightThemes = THEMES.filter((t) => t.group === 'light');

  return (
    <aside
      className="hidden sm:flex fixed left-0 top-0 h-screen w-[220px] flex-col bg-bg-primary border-r border-border px-3 py-4 z-50"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-xs font-mono font-bold">HR</span>
        </div>
        <span className="text-sm font-bold tracking-tight">Habbit Runner</span>
      </Link>

      {/* New Habit CTA */}
      <Link
        to="/habit/new"
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 hover:shadow-[0_0_16px_var(--glow)] transition-all duration-200 mb-4"
      >
        <PlusIcon size={16} />
        New Habit
      </Link>

      {/* Nav section */}
      <div className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">
        Navigate
      </div>
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

      {/* Appearance */}
      <div className="border-t border-border pt-3">
        <div className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] px-2 mb-1">
          Appearance
        </div>
        <div className="group relative">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-bg-secondary transition-all duration-200"
            aria-label="Choose color theme"
          >
            <PaletteIcon size={16} />
            <span className="flex-1 text-left capitalize">{theme}</span>
            <span className="text-[10px] opacity-50">▼</span>
          </button>
          <div className="absolute left-0 bottom-full mb-1 w-full bg-bg-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-1.5 flex flex-col gap-0.5 z-10">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <MoonIcon size={10} className="text-muted" />
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Dark</span>
            </div>
            {darkThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
                aria-label={`Switch to ${t.name} theme`}
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
                onClick={() => onThemeChange(t.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === t.id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-bg-secondary hover:text-foreground'}`}
                aria-label={`Switch to ${t.name} theme`}
              >
                <div className="flex gap-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accentSecondary }} />
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
```

- [ ] **Step 2: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/components/SidebarNav.tsx
git commit -m "feat(web): add desktop SidebarNav component"
```

---

### Task 4: Create AppLayout.tsx

**Files:**
- Create: `packages/web/src/components/AppLayout.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/components/AppLayout.tsx
git commit -m "feat(web): add AppLayout with sidebar + bottom nav"
```

---

## Chunk 2: Wiring + Cleanup + Visual Updates

### Task 5: Wire App.tsx — replace Nav with AppLayout

**Files:**
- Modify: `packages/web/src/App.tsx`
- Delete: `packages/web/src/components/Nav.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the entire authenticated JSX block. Changes:
1. Remove `import { Nav }` line (line 9)
2. Add `import { AppLayout }`
3. In the authenticated JSX: remove `<Nav .../>`, remove `pt-14` from `<main>`, remove `<footer>`, wrap routes in `<AppLayout>`
4. Remove `pt-14` from `AuthCallbackPage` div

Full updated `App.tsx` authenticated section (lines 151-204):

```tsx
import { AppLayout } from '@/components/AppLayout';
// remove: import { Nav } from '@/components/Nav';
```

`AuthCallbackPage` component — remove `pt-14`:
```tsx
function AuthCallbackPage({ message }: AuthCallbackPageProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-sm font-mono text-muted">{message ?? 'Finishing login…'}</div>
    </div>
  );
}
```

Authenticated JSX block — replace from `<BrowserRouter>` to `</BrowserRouter>`:
```tsx
<BrowserRouter>
  <PullToRefresh
    enabled={Boolean(authSession)}
    isRefreshing={syncState.status === 'syncing'}
    onRefresh={syncState.syncNow}
  >
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:border focus:border-accent focus:bg-bg-card focus:px-3 focus:py-2 focus:text-xs focus:text-foreground"
    >
      Skip to main content
    </a>
    <AppLayout theme={theme} onThemeChange={setTheme} onLogout={logout}>
      <RouteFocusManager />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/habit/new" element={<AddEditHabit />} />
        <Route path="/habit/:id" element={<HabitDetail />} />
        <Route path="/habit/:id/edit" element={<AddEditHabit />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  </PullToRefresh>
</BrowserRouter>
```

- [ ] **Step 2: Delete Nav.tsx**
```bash
rm packages/web/src/components/Nav.tsx
```

- [ ] **Step 3: Verify dev server compiles**
```bash
cd packages/web && npm run build 2>&1 | head -30
```
Expected: no TypeScript errors about missing Nav import.

- [ ] **Step 4: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/App.tsx
git rm packages/web/src/components/Nav.tsx
git commit -m "feat(web): wire AppLayout, remove Nav — navigation restructure"
```

---

### Task 6: pt-14 sweep across all page components

**Files:**
- Modify: `packages/web/src/pages/components/DashboardView.tsx` (lines 302, 313)
- Modify: `packages/web/src/pages/components/HabitDetailView.tsx` (pt-14 + sticky top-14)
- Modify: `packages/web/src/pages/components/StatsView.tsx`
- Modify: `packages/web/src/pages/components/add-edit-habit/AddEditHabitPage.tsx` (pt-14 + sticky top-14 in HeaderSection)
- Modify: `packages/web/src/pages/HabitDetail.tsx` (~line 93)
- Modify: `packages/web/src/pages/AddEditHabit.tsx` (~line 9)

- [ ] **Step 1: Remove pt-14 from DashboardView.tsx (both occurrences)**

Find `min-h-screen bg-bg-primary pt-14` (×2) and change to `min-h-screen bg-bg-primary`.

- [ ] **Step 2: Remove pt-14 and fix sticky header in HabitDetailView.tsx**

Find `min-h-screen bg-bg-primary pt-14` → `min-h-screen bg-bg-primary`.
Find `sticky top-14 z-10` → `sticky top-0 z-10`.

- [ ] **Step 3: Remove pt-14 from StatsView.tsx**

Find `min-h-screen bg-bg-primary pt-14` → `min-h-screen bg-bg-primary`.

- [ ] **Step 4: Remove pt-14 and fix sticky header in AddEditHabitPage.tsx**

Find `min-h-screen bg-bg-primary pt-14` → `min-h-screen bg-bg-primary`.
Find `sticky top-14 z-10` (in HeaderSection) → `sticky top-0 z-10`.

- [ ] **Step 5: Remove pt-14 from HabitDetail.tsx**

Find the guard branch div with `pt-14` (~line 93) and remove `pt-14`.

- [ ] **Step 6: Remove pt-14 from AddEditHabit.tsx**

Find the outer shell div with `pt-14` (~line 9) and remove `pt-14`.

- [ ] **Step 7: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/pages/
git commit -m "fix(web): remove pt-14 from all page components — no top nav offset needed"
```

---

### Task 7: Fix PullToRefresh indicator position

**Files:**
- Modify: `packages/web/src/components/PullToRefresh.tsx:122`

- [ ] **Step 1: Change top-16 to top-4**

In `PullToRefresh.tsx`, find `fixed left-1/2 top-16 z-40` and change to `fixed left-1/2 top-4 z-40`.

- [ ] **Step 2: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/components/PullToRefresh.tsx
git commit -m "fix(web): reposition pull-to-refresh indicator from top-16 to top-4"
```

---

### Task 8: Dashboard Hero — add CompletionRing

**Files:**
- Modify: `packages/web/src/pages/components/DashboardView.tsx` (`DashboardHero` function, lines 44-113)

- [ ] **Step 1: Add CompletionRing import**

Add to imports at top of `DashboardView.tsx`:
```tsx
import { CompletionRing } from '@/components/CompletionRing';
```

- [ ] **Step 2: Replace DashboardHero JSX**

Replace the entire `return (...)` block of `DashboardHero` (lines 52-112):

```tsx
return (
  <div className="border-b border-border bg-bg-primary px-4 py-4">
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-5 mb-3">
        <CompletionRing size={88} strokeWidth={7} percentage={todayRate} />
        <div className="flex-1 flex flex-col gap-2">
          <div>
            <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-0.5">{dateStr}</p>
            <h1 className="text-xl font-semibold text-foreground">Today</h1>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-bg-card border border-border rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <ZapIcon size={10} className="text-accent" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Active</span>
              </div>
              <span className="text-lg font-mono font-bold text-foreground">{totalActive}</span>
            </div>
            <div className="bg-bg-card border border-border rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <FlameIcon size={10} className="text-accent-secondary" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Streak</span>
              </div>
              <span className="text-lg font-mono font-bold text-accent-secondary">{overallStreak}d</span>
            </div>
            <div className="bg-bg-card border border-border rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUpIcon size={10} className="text-accent-secondary" />
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Done</span>
              </div>
              <span className="text-lg font-mono font-bold text-accent-secondary">{completedToday}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[3px] bg-border rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${todayRate}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
            boxShadow: '0 0 8px var(--glow)'
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted">Filters</div>
        <button
          type="button"
          onClick={handleExport}
          className="text-[10px] font-mono uppercase tracking-[0.3em] border border-border px-3 py-1 rounded-full transition hover:border-accent hover:text-accent"
        >
          Export CSV
        </button>
      </div>
    </div>
  </div>
);
```

- [ ] **Step 3: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/pages/components/DashboardView.tsx
git commit -m "feat(web): replace dashboard hero % text with CompletionRing"
```

---

### Task 9: HabitRow — card design with accent border

**Files:**
- Modify: `packages/web/src/pages/components/DashboardView.helpers.tsx`

- [ ] **Step 1: Fix streak visibility in HabitRowMetrics**

In `HabitRowMetrics` function (~line 100), find:
```tsx
<div className="hidden sm:flex items-center gap-1 w-12 sm:w-16 justify-end">
```
Change to:
```tsx
<div className="flex items-center gap-1 w-12 sm:w-16 justify-end">
```

- [ ] **Step 2: Replace HabitRow return with card design**

Replace the entire `return (...)` block of `HabitRow` (lines 180-279) with:

```tsx
return (
  <div
    draggable={Boolean(onDragStart)}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragEnd={onDragEnd}
    tabIndex={0}
    role="listitem"
    aria-label={`${habit.name}, ${completed ? 'completed' : 'not completed'}`}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onDetail();
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    }}
    className={`group flex items-stretch bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-border-hover transition-colors cursor-pointer ${
      isDropTarget ? 'border-accent/60 bg-accent/5' : ''
    }`}
  >
    {/* Accent strip */}
    <div
      className="w-1 self-stretch flex-shrink-0"
      style={{ background: accent.hex }}
      aria-hidden
    />

    {/* Card body */}
    <div className="flex-1 flex items-center gap-3 px-3 py-2.5">
      {/* Drag handle */}
      <div className="hidden sm:flex items-center pr-1">
        <GripVerticalIcon size={14} className="text-muted" aria-hidden />
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          completed
            ? `${accent.bgClass} ${accent.borderClass} ${accent.shadowClass}`
            : 'border-border-hover hover:border-muted'
        }`}
        aria-label={`Mark ${habit.name} as ${completed ? 'incomplete' : 'complete'}`}
      >
        {completed && <CheckIcon size={11} className={accent.textClass} strokeWidth={3} />}
      </button>

      {/* Icon + info */}
      <button
        type="button"
        onClick={onDetail}
        className="flex flex-1 min-w-0 items-center gap-2.5 text-left"
      >
        <span className="flex-shrink-0 text-base leading-none">{habit.icon}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium ${completed ? 'text-muted line-through' : 'text-foreground'} truncate`}>
            {habit.name}
          </div>
          <div className="text-[10px] font-mono text-muted mt-0.5">
            {todayCount}/{target} today
          </div>
          <div className="hidden sm:flex items-center gap-2 mt-0.5">
            {habit.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground bg-bg-card border border-border rounded px-1.5 py-0.5"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent.hex }} />
                {tag}
              </span>
            ))}
          </div>
          <HabitRowMobileStats
            habit={habit}
            streak={streak}
            last7={last7}
            completionRate={completionRate}
          />
        </div>
      </button>

      {/* Desktop metrics */}
      <HabitRowMetrics
        habit={habit}
        target={target}
        streak={streak}
        last7={last7}
        completionRate={completionRate}
      />

      {/* Chevron */}
      <button
        type="button"
        onClick={onDetail}
        aria-label={`Open details for ${habit.name}`}
        className="hidden sm:block text-border-hover group-hover:text-muted transition-colors"
      >
        <ChevronRightIcon size={14} />
      </button>
    </div>
  </div>
);
```

Note: `HabitRowMobileStats` is now inside the card (no longer a sibling). Do NOT pass `className="sm:hidden"` to it — it's always visible.

- [ ] **Step 3: Update habit list container to use gap-2 for card spacing**

In `HabitListSection` (in `DashboardView.tsx`), find the list container div and ensure it uses `flex flex-col gap-2` instead of no gap (cards need spacing between them, unlike the old border-b rows). Look for `role="list"` container and update its className to include `gap-2 px-4 py-3`.

- [ ] **Step 4: Commit**
```bash
cd /Users/sash/Dev/Projects/habbit-runner
git add packages/web/src/pages/components/DashboardView.helpers.tsx
git add packages/web/src/pages/components/DashboardView.tsx
git commit -m "feat(web): redesign habit cards with accent border and card layout"
```
