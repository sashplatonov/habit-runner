<script lang="ts">
  import { ListChecks } from 'lucide-svelte';
  import type { Habit } from '@/types/habit';

  type Props = {
    habitType: Habit['type'];
    dailyTarget: number;
  };

  let { habitType = $bindable<Habit['type']>('positive'), dailyTarget }: Props = $props();

  const ruleSummary = $derived(
    habitType === 'negative'
      ? 'Mark the day done when the count is still zero: success means one fewer slip.'
      : `Complete ${dailyTarget} scheduled repetition${dailyTarget === 1 ? '' : 's'} to mark the day done.`
  );
</script>

<section
  class="rounded-surface border border-border bg-bg-card shadow-surface p-4 sm:p-5"
  aria-labelledby="habit-type-title"
  data-editor-habit-type
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h2 id="habit-type-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Habit type</h2>
      <p class="mt-1 text-[13px] leading-5 text-muted">Choose whether success means doing something or avoiding it.</p>
    </div>
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <ListChecks size={18} strokeWidth={1.8} aria-hidden="true" />
    </span>
  </div>

  <div class="mt-4" role="group" aria-labelledby="habit-type-title">
    <div class="grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg-secondary p-1">
      <button
        type="button"
        class={`flex items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${habitType === 'positive' ? 'bg-bg-primary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
        style="min-height: 44px;"
        aria-pressed={habitType === 'positive'}
        data-habit-type-option="positive"
        onclick={() => {
          habitType = 'positive';
        }}
      >
        Build habit
      </button>
      <button
        type="button"
        class={`flex items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${habitType === 'negative' ? 'bg-bg-primary text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
        style="min-height: 44px;"
        aria-pressed={habitType === 'negative'}
        data-habit-type-option="negative"
        onclick={() => {
          habitType = 'negative';
        }}
      >
        Avoid habit
      </button>
    </div>

    <p class="mt-2.5 rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-[11px] leading-4 text-muted">
      Build habit: scheduled opportunities are completed by doing the target action. Avoid habit: success means the unwanted
      action did not occur.
    </p>
  </div>
</section>

<section
  class="rounded-surface border border-border bg-bg-card shadow-surface p-4 sm:p-5"
  aria-labelledby="habit-type-rule-title"
>
  <h2 id="habit-type-rule-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Current rule</h2>
  <div class="mt-2.5 rounded-2xl border border-border bg-bg-primary p-3">
    <p class="text-[13px] font-bold text-foreground" data-editor-habit-type-rule>
      {habitType === 'negative' ? 'Avoid habit' : 'Build habit'}
    </p>
    <p class="mt-0.5 text-[11px] leading-4 text-muted">{ruleSummary}</p>
  </div>
</section>