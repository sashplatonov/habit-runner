<script lang="ts">
  import { HABIT_COLOR_THEMES, DEFAULT_HABIT_COLOR } from '$lib/theme/habit-colors';
  import type { HabitColor } from '$lib/types/habit';
  import { formatDate } from '$lib/habits/habitStats';
  import { formatAppDate } from '$lib/i18n';
  import { normalizeToCompletionKey } from '$lib/completionKey';

  const FILL_OPACITIES = [0, 0.22, 0.46, 0.72, 1.0] as const;
  const DAYS = 90;

  let {
    completions,
    dailyTarget = 1,
    color = DEFAULT_HABIT_COLOR,
    compact = false,
    dayDetails
  }: {
    completions: Record<string, number>;
    dailyTarget?: number;
    color?: HabitColor;
    compact?: boolean;
    dayDetails?: Record<string, string[]>;
  } = $props();

  type Cell = {
    date: string;
    intensity: number;
    isToday: boolean;
    isOutOfRange: boolean;
  };

  function getIntensity(count: number, target: number): number {
    if (count <= 0) return 0;
    const ratio = count / Math.max(1, target);
    if (ratio >= 1) return 4;
    if (ratio >= 0.75) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
  }

  function buildWeeks(comps: Record<string, number>, dt: number): Cell[][] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);
    const rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() - (DAYS - 1));
    const rangeStartStr = formatDate(rangeStart);
    const dayOfWeek = (rangeStart.getDay() + 6) % 7;
    const gridStart = new Date(rangeStart);
    gridStart.setDate(rangeStart.getDate() - dayOfWeek);
    const weeks: Cell[][] = [];
    const cursor = new Date(gridStart);
    while (formatDate(cursor) <= todayStr) {
      const week: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = formatDate(cursor);
        week.push({
          date: dateStr,
          intensity: getIntensity(comps[dateStr] ?? 0, dt),
          isToday: dateStr === todayStr,
          isOutOfRange: dateStr > todayStr || dateStr < rangeStartStr
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  function buildMonthMarkers(weeks: Cell[][]): { label: string; index: number }[] {
    const markers: { label: string; index: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, idx) => {
      const weekStart = new Date(normalizeToCompletionKey(week[0].date));
      const m = weekStart.getMonth();
      if (m !== lastMonth) {
        markers.push({ label: weekStart.toLocaleString('default', { month: 'short' }), index: idx });
        lastMonth = m;
      }
    });
    return markers;
  }

  const weeks = $derived(buildWeeks(completions, dailyTarget));
  const { hex: accentHex, glow } = HABIT_COLOR_THEMES[color];
  const n = $derived(weeks.length);
  const markers = $derived(buildMonthMarkers(weeks));

  let tooltip = $state<{ x: number; y: number; date: string; habits: string[] } | null>(null);

  function cellStyle(cell: Cell): string {
    if (cell.isOutOfRange) return 'background-color: transparent; opacity: 0';
    if (cell.intensity === 0) return 'background-color: var(--border); opacity: 0.5';
    return `background-color: ${accentHex}; opacity: ${FILL_OPACITIES[cell.intensity]}; box-shadow: 0 0 4px ${glow}`;
  }

  function cellOutline(cell: Cell): string {
    return cell.isToday && !cell.isOutOfRange ? `1px solid ${accentHex}` : 'none';
  }

  function formatTooltipDate(date: string) {
    const parsed = new Date(normalizeToCompletionKey(date));
    return formatAppDate(parsed, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  function handleCellHover(cell: Cell, event: MouseEvent) {
    if (cell.isOutOfRange) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const habits = dayDetails?.[cell.date] ?? [];
    const maxLeft = window.innerWidth - 200 - 8;
    tooltip = {
      x: Math.min(rect.left + 8, maxLeft),
      y: rect.top - 36,
      date: cell.date,
      habits
    };
  }
</script>

{#if compact}
  <div
    class="grid gap-[2px]"
    style="grid-template-columns: repeat({n}, 4px); grid-template-rows: repeat(7, 4px); grid-auto-flow: column;"
  >
    {#each weeks.flat() as cell}
      <div
        class="w-[4px] h-[4px] rounded-[1px]"
        style="{cellStyle(cell)}; outline: {cellOutline(cell)}; outline-offset: 1px;"
      ></div>
    {/each}
  </div>
{:else}
  <div class="relative select-none sm:max-w-[320px] sm:mx-auto">
    <div class="flex w-full gap-0">
      <div
        class="grid shrink-0 gap-1 sm:gap-1.5 mr-1.5"
        style="width: 16px; grid-template-rows: repeat(7, minmax(0, 1fr))"
      >
        {#each ['M', '', 'W', '', 'F', '', ''] as label}
          <div class="text-[9px] font-mono text-muted flex items-center">{label}</div>
        {/each}
      </div>

      <div
        class="grid flex-1 gap-1 sm:gap-1.5"
        style="grid-template-columns: repeat({n}, minmax(0, 1fr))"
      >
        {#each weeks as week}
          <div class="grid gap-1 sm:gap-1.5" style="grid-template-rows: repeat(7, minmax(0, 1fr))">
            {#each week as cell}
              <div
                class="aspect-square w-full rounded-[2px] transition-transform hover:scale-110"
                style="{cellStyle(cell)}; cursor: {cell.isOutOfRange ? 'default' : 'pointer'}; outline: {cellOutline(cell)}; outline-offset: 1px;"
                onmouseenter={(e) => handleCellHover(cell, e)}
                onmouseleave={() => (tooltip = null)}
              ></div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    {#if markers.length > 0}
      <div class="relative mt-1 h-4 ml-[18px] overflow-hidden">
        {#each markers as m}
          <span
            class="absolute text-[9px] font-mono text-muted"
            style="left: {(m.index / n) * 100}%"
          >
            {m.label}
          </span>
        {/each}
      </div>
    {/if}

    {#if tooltip}
      <div
        class="fixed z-50 pointer-events-none px-3 py-2 rounded bg-bg-card border border-border text-[10px] font-mono text-foreground shadow-lg"
        style="left: {tooltip.x}px; top: {tooltip.y}px; max-width: 200px"
      >
        <p class="text-[10px] font-mono text-muted mb-1">{formatTooltipDate(tooltip.date)}</p>
        {#if tooltip.habits.length > 0}
          {#each tooltip.habits as habitLabel}
            <p class="text-[11px] font-mono text-foreground">{habitLabel}</p>
          {/each}
        {:else}
          <p class="text-[10px] font-mono text-muted">No habits finished that day.</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}
