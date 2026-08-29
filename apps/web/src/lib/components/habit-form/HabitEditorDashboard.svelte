<script lang="ts">
  import {
    Bell,
    CalendarDays,
    ChevronRight,
    ListChecks,
    SlidersHorizontal,
    Tags,
    Target,
    UserRound
  } from 'lucide-svelte';
  import HabitPreview from '../habits/HabitPreview.svelte';
  import type { HabitEditorPanel } from '../HabitForm.svelte';

  type Tile = {
    panel: Exclude<HabitEditorPanel, 'dashboard'>;
    title: string;
    summary: string;
    icon: typeof UserRound;
    tone: string;
  };

  type Props = {
    habitLabel: string;
    colorHex: string;
    colorLabel: string;
    typeLabel: string;
    scheduleSummary: string;
    reminderSummary: string;
    targetLabel: string;
    tagsSummary: string;
    onSelect: (panel: Exclude<HabitEditorPanel, 'dashboard'>) => void;
  };

  let {
    habitLabel,
    colorHex,
    colorLabel,
    typeLabel,
    scheduleSummary,
    reminderSummary,
    targetLabel,
    tagsSummary,
    onSelect
  }: Props = $props();

  const tiles = $derived<Tile[]>([
    { panel: 'identity', title: 'Identity', summary: `${habitLabel} · ${colorLabel}`, icon: UserRound, tone: 'text-cyan-600 bg-cyan-50' },
    { panel: 'habit-type', title: 'Habit type', summary: typeLabel, icon: ListChecks, tone: 'text-emerald-600 bg-emerald-50' },
    { panel: 'schedule', title: 'Schedule', summary: scheduleSummary, icon: CalendarDays, tone: 'text-indigo-500 bg-indigo-50' },
    { panel: 'goal', title: 'Goal', summary: targetLabel.replace('Target ', ''), icon: Target, tone: 'text-orange-500 bg-orange-50' },
    { panel: 'reminder', title: 'Reminder', summary: reminderSummary, icon: Bell, tone: 'text-violet-500 bg-violet-50' },
    { panel: 'organization', title: 'Organization', summary: tagsSummary, icon: Tags, tone: 'text-cyan-600 bg-cyan-50' }
  ]);
</script>

<div class="space-y-3" data-editor-dashboard>
  <HabitPreview
    {habitLabel}
    {colorHex}
    {colorLabel}
    {typeLabel}
    {scheduleSummary}
    {reminderSummary}
    {targetLabel}
  />

  <section class="rounded-[1.5rem] border border-border bg-bg-card/92 p-4 shadow-[0_20px_54px_rgba(15,23,42,0.08)]" aria-labelledby="quick-settings-title">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 id="quick-settings-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Quick settings</h2>
        <p class="mt-1 text-xs leading-5 text-muted">Everything important at a glance. Tap a block to edit it.</p>
      </div>
      <SlidersHorizontal class="mt-0.5 shrink-0 text-muted" size={18} aria-hidden="true" />
    </div>
    <div class="mt-3 grid grid-cols-2 gap-2.5">
      {#each tiles as tile, tileIndex (`${tile.panel}-${tileIndex}`)}
        <button
          type="button"
          class="relative min-h-[104px] rounded-2xl border border-border bg-bg-primary p-3 text-left transition hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          data-editor-tile={tile.panel}
          aria-label={`Edit ${tile.title}`}
          onclick={() => onSelect(tile.panel)}
        >
          <span class={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl ${tile.tone}`}>
            <tile.icon size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span class="block text-[13px] font-semibold text-foreground">{tile.title}</span>
          <span class="mt-1 block text-[11px] leading-4 text-muted">{tile.summary}</span>
          <ChevronRight class="absolute right-2.5 top-2.5 text-muted" size={16} aria-hidden="true" />
        </button>
      {/each}
    </div>
  </section>

  <section class="rounded-[1.5rem] border border-border bg-bg-card/92 p-4 shadow-[0_20px_54px_rgba(15,23,42,0.08)]" aria-labelledby="advanced-settings-title">
    <div class="flex items-start gap-3">
      <div>
        <h2 id="advanced-settings-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Advanced</h2>
        <p class="mt-1 text-xs leading-5 text-muted">Less common behavior and notification settings.</p>
      </div>
      <SlidersHorizontal class="ml-auto mt-0.5 shrink-0 text-muted" size={18} aria-hidden="true" />
    </div>
    <div class="mt-3 grid gap-2">
      <div class="flex items-center gap-3 rounded-2xl border border-border bg-bg-primary p-3">
        <CalendarDays class="text-muted" size={18} aria-hidden="true" />
        <div><p class="text-xs font-semibold text-foreground">Schedule rules</p><p class="mt-0.5 text-[11px] text-muted">{scheduleSummary}</p></div>
      </div>
      <div class="flex items-center gap-3 rounded-2xl border border-border bg-bg-primary p-3">
        <Bell class="text-muted" size={18} aria-hidden="true" />
        <div><p class="text-xs font-semibold text-foreground">Notification behavior</p><p class="mt-0.5 text-[11px] text-muted">{reminderSummary}</p></div>
      </div>
    </div>
  </section>
</div>
