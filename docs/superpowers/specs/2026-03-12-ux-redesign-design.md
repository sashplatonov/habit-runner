
# UX Redesign — Web & Mobile Visual Unification

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Navigation overhaul, dashboard hero, habit card accents, typography

---

## Overview

Refactor the Habbit Runner frontend to have a purposeful layout per platform — sidebar on desktop, bottom tab bar on mobile — while sharing the same visual components. Six coordinated changes that work as a cohesive redesign.

---

## Architecture

### Layout Component Tree

```
App.tsx
└── BrowserRouter           ← stays here, unchanged
    └── AuthGate
        └── AppLayout.tsx   ← NEW — replaces Nav.tsx entirely
            ├── SidebarNav.tsx   ← NEW — desktop only (sm+)
            ├── <main>           ← content, no pt-14
            ├── <footer>         ← build timestamp, inside AppLayout
            └── BottomNav.tsx    ← NEW — mobile only (<sm)
```

`AppLayout` **must be rendered as a child of `BrowserRouter`** — it uses `Link`/`NavLink` internally. `Nav.tsx` is deleted entirely.

---

## Change 1 — AppLayout.tsx

**File:** `src/components/AppLayout.tsx`

Layout-only container. No visual styling beyond structural layout.

**Desktop (`sm:` and above):**
- `flex-row`
- `SidebarNav` fixed left, `w-[220px]`, full viewport height
- `<main>` with `ml-[220px]`, no top padding

**Mobile (below `sm:`):**
- `flex-col`
- `<main>` with `pb-[72px]` + `env(safe-area-inset-bottom)` to clear bottom nav
- `BottomNav` fixed at bottom

**Props:**
```ts
interface AppLayoutProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onLogout?: () => void | Promise<void>;
  children: React.ReactNode;
}
```

**App.tsx changes:**
- Remove `<Nav>` import and usage
- Remove `pt-14` from `<main>` in the authenticated layout
- Wrap authenticated content in `<AppLayout theme={...} onThemeChange={...} onLogout={...}>`
- Remove `pt-14` from `AuthCallbackPage` root div (line ~42)
- Move `<footer>` (build timestamp) inside `AppLayout` — it renders in the main scroll area on both platforms

---

## Change 2 — SidebarNav.tsx

**File:** `src/components/SidebarNav.tsx`
**Visibility:** `hidden sm:flex` (desktop only)

Layout: `fixed left-0 top-0 h-screen w-[220px] flex flex-col bg-bg-primary border-r border-border px-3 py-4`

**Structure (top → bottom):**
1. Logo row: HR badge + "Habbit Runner" text
2. "New Habit" CTA — `<Link to="/habit/new">`, accent background, full width, `mb-4`
3. Section label "Navigate"
4. `<NavLink to="/">` Dashboard — active style: `bg-accent/10 text-accent`
5. `<NavLink to="/stats">` Stats — active style: `bg-accent-secondary/10 text-accent-secondary`
6. `flex-1` spacer
7. Section label "Appearance"
8. Theme picker — inline hover dropdown (same pattern as current `Nav.tsx`)
9. Logout button (`onLogout` prop, `() => void | Promise<void>`)

Reuses existing `NavLink`, `THEMES`, `ThemeId` — no new logic.

---

## Change 3 — BottomNav.tsx

**File:** `src/components/BottomNav.tsx`
**Visibility:** `flex sm:hidden` (mobile only)

Layout:
```
fixed bottom-0 left-0 right-0 h-[72px] flex
bg-bg-primary/95 border-t border-border backdrop-blur-sm
```

iOS safe area: use inline style `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` on the root element. (`pb-safe` is not a built-in Tailwind utility — do not use it.)

**5 slots:**
| Slot | Icon | Action |
|------|------|--------|
| Dashboard | `LayoutDashboardIcon` | `<NavLink to="/">` |
| Stats | `BarChart2Icon` | `<NavLink to="/stats">` |
| **FAB** | `+` | `<Link to="/habit/new">` |
| Search | `SearchIcon` | `disabled` placeholder, no-op — same treatment as the spec's Search slot |
| Theme | `PaletteIcon` | toggles `isThemeOpen` local state |

**FAB styling:**
- `52×52px`, `rounded-2xl`
- `bg-accent text-bg` (accent background, bg-colored text/icon)
- `box-shadow: 0 0 20px var(--glow), 0 8px 16px rgba(0,0,0,0.4)`

**Theme slot — implementation:**
`BottomNav` owns a `useState<boolean>` (`isThemeOpen`). When open, renders an absolute-positioned panel above the nav bar (`bottom-[72px] right-0 w-44`) with the same theme list as the current `Nav.tsx` dropdown. Tapping outside closes it (`useRef` + `mousedown` handler or a transparent overlay div). Pass `theme` and `onThemeChange` as props.

**Active tab:** icon wrapper gets `bg-accent/10 rounded-xl`, text gets `text-accent`.

**Props:**
```ts
interface BottomNavProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onLogout?: () => void | Promise<void>;
}
```

---

## Change 4 — Remove pt-14 from all page components

**Files to audit and fix:**
- `src/pages/components/DashboardView.tsx` — two root divs with `pt-14` (onboarding path + main path)
- `src/pages/components/HabitDetailView.tsx` — sticky header uses `top-14`; with no top nav, change to `top-0`
- `src/pages/components/StatsView.tsx` — remove `pt-14` if present
- `src/pages/components/add-edit-habit/AddEditHabitPage.tsx` — remove `pt-14` if present; also the `HeaderSection` sticky header inside uses `sticky top-14 z-10` — change to `sticky top-0 z-10`
- `src/pages/HabitDetail.tsx` — page-level file (wraps `HabitDetailView`); remove `pt-14` from the loading/not-found guard branch (~line 93)
- `src/pages/AddEditHabit.tsx` — page-level file (wraps `AddEditHabitPage`); remove `pt-14` from outer shell wrapper (~line 9)

**PullToRefresh:** `src/components/PullToRefresh.tsx` positions the pull indicator at `top-16` (below the old nav). Change to `top-4` — there is no top nav on mobile anymore.

---

## Change 5 — Dashboard Hero

**File:** `src/pages/components/DashboardView.tsx`
**Component:** `DashboardHero`

**The only structural change is replacing the existing `text-3xl` percentage block (top-right corner) with `<CompletionRing size={88} strokeWidth={7} percentage={todayRate} />`** positioned on the left. The three stat cards and progress bar already exist in the current implementation and are preserved as-is.

**After layout:**
```
<div class="flex items-center gap-5">
  <CompletionRing size={88} strokeWidth={7} percentage={todayRate} />  ← no color prop (uses default)
  <div class="flex-1 flex flex-col gap-2">
    <div class="grid grid-cols-3 gap-2">   ← Active | Streak | Done cards
    <progress bar 3px>
  </div>
</div>
```

- `CompletionRing` `color` prop is **intentionally omitted** — the component uses its `DEFAULT_HABIT_COLOR` fallback (`"blue"`). This is correct: the hero ring represents an aggregate, not a specific habit.
- Progress bar: `h-[3px]` (not `h-1`), same gradient and glow
- Stat cards: `bg-bg-card border border-border rounded-xl p-2`, mono value + muted label

No new components needed — `CompletionRing` already exists.

---

## Change 6 — Habit Card Accent Border

**File:** `src/pages/components/DashboardView.helpers.tsx`
**Component:** `HabitRow`

**Current structure to replace:**

The current `HabitRow` renders an outer `flex-col` wrapper div containing the card as a sibling of `HabitRowMobileStats`:
```
<div class="flex flex-col gap-1">         ← outer wrapper (DELETE this level)
  <div class="group flex flex-wrap ...">  ← card
    ...content...
  </div>
  <HabitRowMobileStats className="sm:hidden" />  ← sibling of card (MOVE inside)
</div>
```

**Replace the entire outer `flex-col` wrapper + card with this structure:**

```
<card>                               flex items-stretch  (replaces both outer wrapper and inner card)
  <accent-strip />                   w-1, self-stretch, bg=accent.hex, rounded-l-xl
  <body>                             flex-1, flex items-center gap-3, px-3 py-2.5
    <icon />
    <info>                           flex-col
      <name />
      <HabitRowMobileStats />        moved here from sibling position, always visible
    </info>
    <HabitRowMetrics />              desktop-only metrics (hidden md:flex stays)
    <check-button />
  </body>
</card>
```

The outer `flex-col` wrapper div is eliminated entirely — its only purpose was to accommodate `HabitRowMobileStats` as a sibling, which is no longer the case.

**Streak visibility:** In `HabitRowMetrics` (not `HabitRowMobileStats`), at approximately line 100 of `DashboardView.helpers.tsx`, the streak wrapper div has `hidden sm:flex` — remove this class so streak is always visible on all screen sizes.

**Touch target:** Card `<body>` min-height is `44px` via `py-2.5` (10px top + 10px bottom + icon 36px = ~56px). No additional changes needed.

---

## Change 7 — Typography: Inter → Sora

**Files:** `index.html`, `tailwind.config.js`, `src/index.css`

**index.html:** Replace Inter Google Fonts link with:
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**tailwind.config.js:**
```js
fontFamily: {
  sans: ['Sora', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'], // unchanged
}
```

**src/index.css:** If `font-family` is hardcoded in `body {}`, update to `'Sora', sans-serif`. Tailwind's base reset should handle this automatically via `font-sans`.

JetBrains Mono remains unchanged for all numeric/monospace contexts.

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/Nav.tsx` | **Delete** |
| `src/components/AppLayout.tsx` | **Create** |
| `src/components/SidebarNav.tsx` | **Create** |
| `src/components/BottomNav.tsx` | **Create** |
| `src/App.tsx` | Update — remove Nav, add AppLayout, remove pt-14, move footer |
| `src/components/PullToRefresh.tsx` | Update — `top-16` → `top-4` |
| `src/pages/components/DashboardView.tsx` | Update — remove pt-14 (×2), Hero with CompletionRing |
| `src/pages/components/HabitDetailView.tsx` | Update — remove pt-14, sticky `top-14` → `top-0` |
| `src/pages/components/StatsView.tsx` | Update — remove pt-14 if present |
| `src/pages/AddEditHabit.tsx` | Update — remove pt-14 from outer shell |
| `src/pages/HabitDetail.tsx` | Update — remove pt-14 from guard branch |
| `src/pages/components/add-edit-habit/AddEditHabitPage.tsx` | Update — remove pt-14, sticky `top-14` → `top-0` in HeaderSection |
| `src/pages/components/DashboardView.helpers.tsx` | Update — accent border, flex-wrap fix, streak visibility |
| `tailwind.config.js` | Update — Sora font |
| `index.html` | Update — Google Fonts URL |
| `src/index.css` | Update — font-family if hardcoded |

---

## Out of Scope

- Stats view layout changes
- Add/Edit habit form changes
- New Search functionality (BottomNav search slot is a disabled placeholder)
- Any backend / sync changes
