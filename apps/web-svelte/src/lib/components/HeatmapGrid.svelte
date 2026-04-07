<script lang="ts">
  import { formatAppDate } from '$lib/i18n';
  import { normalizeToCompletionKey } from '$lib/completionKey';

  type HeatmapDay = {
    date: string;
    intensity: number;
    isFrozen: boolean;
    inWindow: boolean;
  };

  type HeatmapWeek = {
    label: string;
    days: HeatmapDay[];
  };

  let {
    weeks,
    accentHex = 'var(--accent)',
    accentGlow = 'var(--glow)'
  }: {
    weeks: HeatmapWeek[];
    accentHex?: string;
    accentGlow?: string;
  } = $props();

  const FILL_OPACITIES = [0, 0.22, 0.46, 0.72, 1.0];
  const totalWeeks = $derived(weeks.length);
  const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

  let tooltip = $state<{ x: number; y: number; text: string } | null>(null);

  function cellStyle(day: HeatmapDay): string {
    if (!day.inWindow) return 'background-color: transparent; opacity: 0';
    if (day.isFrozen) return 'background-color: var(--accent); opacity: 0.15';
    if (day.intensity === 0) return 'background-color: var(--border); opacity: 0.5';
    const opacity = FILL_OPACITIES[day.intensity] ?? 1;
    return `background-color: ${accentHex}; opacity: ${opacity}; box-shadow: 0 0 4px ${accentGlow}`;
  }

  function today() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  const todayStr = today();

  function cellOutline(day: HeatmapDay): string {
    return day.date === todayStr ? `1px solid ${accentHex}` : 'none';
  }

  function handleHover(day: HeatmapDay, event: MouseEvent) {
    if (!day.inWindow) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const parsed = new Date(normalizeToCompletionKey(day.date));
    const text = formatAppDate(parsed, { weekday: 'short', month: 'short', day: 'numeric' });
    tooltip = { x: rect.left + 8, y: rect.top - 28, text };
  }
</script>

<div class="relative select-none">
  <div class="flex w-full gap-0">
    <div
      class="grid shrink-0 gap-1 sm:gap-1.5 mr-1.5"
      style="width: 16px; grid-template-rows: repeat(7, minmax(0, 1fr))"
    >
      {#each DAY_LABELS as label}
        <div class="text-[9px] font-mono text-muted flex items-center">{label}</div>
      {/each}
    </div>

    <div
      class="grid flex-1 gap-1 sm:gap-1.5"
      style="grid-template-columns: repeat({totalWeeks}, minmax(0, 1fr))"
    >
      {#each weeks as week}
        <div class="grid gap-1 sm:gap-1.5" style="grid-template-rows: repeat(7, minmax(0, 1fr))">
          {#each week.days as day}
            <div
              class="aspect-square w-full rounded-[2px] transition-transform hover:scale-110"
              style="{cellStyle(day)}; cursor: {day.inWindow ? 'pointer' : 'default'}; outline: {cellOutline(day)}; outline-offset: 1px;"
              onmouseenter={(e) => handleHover(day, e)}
              onmouseleave={() => (tooltip = null)}
            ></div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  {#if weeks.length > 0}
    <div class="relative mt-1 h-4 ml-[18px] overflow-hidden">
      {#each weeks as w, idx}
        {#if idx === 0 || weeks[idx - 1]?.days[0]?.date.slice(5, 7) !== w.days[0]?.date.slice(5, 7)}
          {@const parsed = new Date(normalizeToCompletionKey(w.days[0].date))}
          <span
            class="absolute text-[9px] font-mono text-muted"
            style="left: {(idx / totalWeeks) * 100}%"
          >
            {parsed.toLocaleString('default', { month: 'short' })}
          </span>
        {/if}
      {/each}
    </div>
  {/if}

  {#if tooltip}
    <div
      class="fixed z-50 pointer-events-none px-2 py-1 rounded bg-bg-card border border-border text-[10px] font-mono text-foreground shadow-lg"
      style="left: {tooltip.x}px; top: {tooltip.y}px"
    >
      {tooltip.text}
    </div>
  {/if}
</div>
