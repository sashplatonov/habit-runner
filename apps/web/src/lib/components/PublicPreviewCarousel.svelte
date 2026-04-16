<script lang="ts">
  import type { HabitColor } from '@habbit-runner/shared';
  import { ChevronLeft, ChevronRight, Flame, TrendingUp, Zap } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';

  type PreviewHabit = {
    name: string;
    icon: string;
    tags: string[];
    streak: number;
    rate: number;
    color: HabitColor;
    completions: Record<string, number>;
  };

  let carouselElement = $state<HTMLDivElement | null>(null);

  function isoDate(offsetDays = 0) {
    return new Date(Date.now() + offsetDays * 86_400_000).toISOString().split('T')[0] ?? '';
  }

  function buildCompletions(pattern: number[]) {
    return pattern.reduce<Record<string, number>>((completions, count, index) => {
      completions[isoDate(index - 29)] = count;
      return completions;
    }, {});
  }

  const previewHabits: PreviewHabit[] = [
    {
      name: 'Morning Run',
      icon: '🏃',
      tags: ['health', 'energy'],
      streak: 12,
      rate: 88,
      color: 'cyan',
      completions: buildCompletions([1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    },
    {
      name: 'Read 20 pages',
      icon: '📚',
      tags: ['learning', 'focus'],
      streak: 8,
      rate: 76,
      color: 'purple',
      completions: buildCompletions([1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    },
    {
      name: 'No sugar after 18:00',
      icon: '🥗',
      tags: ['nutrition', 'discipline'],
      streak: 6,
      rate: 69,
      color: 'green',
      completions: buildCompletions([0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0])
    }
  ];

  const dailyRates = [67, 100, 67, 67, 100, 67, 33, 67, 67];
  const habitPerformance = [
    { name: 'Morning Run', rate: 90 },
    { name: 'Read 20 pages', rate: 76 },
    { name: 'No sugar after 18:00', rate: 69 }
  ];
  const weeklyHeights = [24, 42, 31, 48, 36, 56, 44];

  function scrollPreview(direction: 'left' | 'right') {
    if (!carouselElement) {
      return;
    }

    const width = Math.max(320, carouselElement.clientWidth * 0.92);
    carouselElement.scrollBy({
      left: direction === 'right' ? width : -width,
      behavior: 'smooth'
    });
  }
</script>

<section id="product-preview" class="border-b border-slate-200 bg-[#f8fafc] px-4 py-12 sm:px-6">
  <div class="mx-auto w-full max-w-6xl">
    <p class="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Inside the app</p>
    <h2 class="mb-5 text-2xl font-semibold text-slate-900">Swipe through real screens</h2>

    <div class="mb-4 flex items-center justify-end gap-2">
      <button
        type="button"
        onclick={() => {
          scrollPreview('left');
        }}
        class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400"
      >
        <ChevronLeft size={14} />
        Left
      </button>
      <button
        type="button"
        onclick={() => {
          scrollPreview('right');
        }}
        class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400"
      >
        Right
        <ChevronRight size={14} />
      </button>
    </div>

    <div
      bind:this={carouselElement}
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <article class="min-w-full snap-start overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.18)]">
        <div class="border-b border-slate-200 bg-white px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-500">
          Dashboard
        </div>
        <div class="relative max-h-[760px] overflow-hidden" data-theme="cloud">
          <div class="space-y-3 bg-bg-primary p-4 text-foreground">
            <div class="rounded-2xl border border-border bg-bg-secondary/60 p-4">
              <div class="flex items-center gap-4">
                <CompletionRing percentage={67} size={52} strokeWidth={4} showText={true} />
                <div class="grid flex-1 grid-cols-3 gap-2">
                  <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
                    <div class="mb-1 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted">
                      <Zap size={10} class="text-accent" />
                      Active
                    </div>
                    <span class="text-base font-mono font-bold">3</span>
                  </div>
                  <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
                    <div class="mb-1 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted">
                      <Flame size={10} class="text-accent-secondary" />
                      Streak
                    </div>
                    <span class="text-base font-mono font-bold text-accent-secondary">15d</span>
                  </div>
                  <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
                    <div class="mb-1 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted">
                      <TrendingUp size={10} class="text-accent-secondary" />
                      Done
                    </div>
                    <span class="text-base font-mono font-bold text-accent-secondary">2</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-bg-card px-3 py-2">
              <div class="h-9 rounded-lg border border-border bg-bg-secondary"></div>
            </div>

            <div class="space-y-3">
              {#each previewHabits as habit, idx (habit.name + '-' + idx)}
                <div class="rounded-2xl border border-border bg-bg-card p-4">
                  <div class="flex items-start gap-3">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg-secondary text-2xl">
                      {habit.icon}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold">{habit.name}</p>
                          <div class="mt-2 flex flex-wrap gap-1.5">
                            {#each habit.tags as tag, tidx (tag + '-' + tidx)}
                              <span class="rounded-full border border-border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
                                {tag}
                              </span>
                            {/each}
                          </div>
                        </div>
                        <CompletionRing percentage={habit.rate} size={40} strokeWidth={3} color={habit.color} />
                      </div>

                      <div class="mt-3 flex items-center justify-between gap-3">
                        <MiniHeatmap completions={habit.completions} dailyTarget={1} color={habit.color} />
                        <div class="shrink-0 text-right text-[10px] font-mono uppercase tracking-[0.22em] text-muted">
                          {habit.streak}d streak
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#f8f9fb]"></div>
        </div>
      </article>

      <article class="min-w-full snap-start overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.18)]">
        <div class="border-b border-slate-200 bg-white px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-500">
          Edit Habit
        </div>
        <div class="relative max-h-[760px] overflow-hidden" data-theme="cloud">
          <div class="space-y-4 bg-bg-primary p-4 text-foreground">
            <div class="flex items-center justify-between gap-4 rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
              <div>
                <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Wave 6 form</p>
                <h3 class="mt-2 text-xl font-semibold">Edit habit</h3>
                <p class="mt-2 max-w-xl text-sm text-muted">Update the habit without leaving the SvelteKit route tree.</p>
              </div>
              <div class="rounded-full border border-border px-4 py-2 text-sm text-muted">Back</div>
            </div>

            <div class="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div class="space-y-4 rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
                <div>
                  <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Name</p>
                  <div class="mt-2 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm">Read 20 pages</div>
                </div>
                <div>
                  <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Description</p>
                  <div class="mt-2 min-h-[110px] rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-muted">
                    Build a consistent nightly reading routine.
                  </div>
                </div>
                <div class="grid gap-2 sm:grid-cols-3">
                  {#each ['Daily', 'Weekdays', 'Custom'] as option, optIdx (option + '-' + optIdx)}
                    <div class={`rounded-2xl border px-4 py-3 text-left text-sm ${option === 'Daily' ? 'border-accent bg-accent/10' : 'border-border bg-bg-secondary text-muted'}`}>
                      <span class="block font-semibold">{option}</span>
                      <span class="mt-1 block text-xs text-muted">Schedule option</span>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="space-y-4 rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
                <div>
                  <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Icon</p>
                  <div class="mt-2 grid grid-cols-5 gap-2">
                    {#each ['📚', '🏃', '💧', '🧘', '💻'] as option, iconOptIdx (option + '-' + iconOptIdx)}
                      <div class={`flex h-12 items-center justify-center rounded-2xl border text-xl ${option === '📚' ? 'border-accent bg-accent/10' : 'border-border bg-bg-secondary'}`}>
                        {option}
                      </div>
                    {/each}
                  </div>
                </div>

                <div>
                  <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Tags</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    {#each ['learning', 'focus'] as tag, tagOptIdx (tag + '-' + tagOptIdx)}
                      <span class="inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
                        {tag}
                      </span>
                    {/each}
                  </div>
                </div>

                <div>
                  <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">Reminder time</p>
                  <div class="mt-2 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm">21:00</div>
                </div>
              </div>
            </div>
          </div>
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#f8f9fb]"></div>
        </div>
      </article>

      <article class="min-w-full snap-start overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.18)]">
        <div class="border-b border-slate-200 bg-white px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-slate-500">
          Stats
        </div>
        <div class="relative max-h-[760px] overflow-hidden" data-theme="cloud">
          <div class="space-y-4 bg-bg-primary p-4 text-foreground">
            <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
              <div class="space-y-2 rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
                <h3 class="text-xs font-mono uppercase tracking-wider text-muted">Overview signals</h3>
                <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {#each [{ label: 'Avg Rate', value: '78%' }, { label: 'Best', value: '21d' }, { label: 'Total', value: '68' }, { label: 'Active', value: '3' }] as card, cardIdx (card.label + '-' + cardIdx)}
                    <div class="rounded-lg border border-border bg-bg-secondary p-3">
                      <p class="text-[9px] font-mono uppercase tracking-wider text-muted">{card.label}</p>
                      <div class="mt-2 text-2xl font-mono font-bold text-foreground">{card.value}</div>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
                <h3 class="text-xs font-mono uppercase tracking-wider text-muted">Your Investment</h3>
                <div class="mt-3 text-3xl font-mono font-bold text-accent">78%</div>
                <div class="mt-3 h-2 overflow-hidden rounded-full bg-border">
                  <div class="h-full w-[78%] bg-accent" style:box-shadow="0 0 10px var(--glow)"></div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-xs font-mono uppercase tracking-wider text-muted">Daily completion rate</h3>
                <span class="text-[10px] font-mono text-accent">78% avg</span>
              </div>
              <div class="flex h-[150px] items-end gap-[4px]">
                {#each dailyRates as rate, index (`rate-${index}`)}
                  <div class="flex flex-1 flex-col items-center justify-end">
                    <div class="w-full rounded-t-sm bg-accent" style:height="{Math.max(2, rate * 1.3)}px" style:box-shadow="0 0 4px var(--glow)"></div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
                <h3 class="mb-3 text-xs font-mono uppercase tracking-wider text-muted">Per-habit performance</h3>
                <div class="space-y-3">
                  {#each habitPerformance as habit, hpIdx (habit.name + '-' + hpIdx)}
                    <div class="flex items-center gap-3">
                      <span class="w-20 shrink-0 text-[11px] font-mono text-muted">{habit.name}</span>
                      <div class="h-5 min-w-0 flex-1 overflow-hidden rounded-sm bg-border">
                        <div class="h-full rounded-sm bg-accent-secondary" style:width="{habit.rate}%" style:box-shadow="0 0 6px var(--glow-secondary)"></div>
                      </div>
                      <span class="w-8 shrink-0 text-right text-[10px] font-mono text-accent-secondary">{habit.rate}%</span>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="rounded-3xl border border-border bg-bg-card p-5 shadow-glow-blue-sm">
                <h3 class="mb-3 text-xs font-mono uppercase tracking-wider text-muted">Weekday breakdown</h3>
                <div class="flex gap-2">
                  {#each weeklyHeights as height, index (`weekday-${index}`)}
                    <div class="flex flex-1 flex-col items-center gap-2">
                      <div class="relative h-20 w-full overflow-hidden rounded-sm bg-border">
                        <div class="absolute bottom-0 w-full rounded-sm bg-accent" style:height="{height}px"></div>
                      </div>
                      <span class="text-[9px] font-mono text-muted">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#f8f9fb]"></div>
        </div>
      </article>
    </div>
  </div>
</section>