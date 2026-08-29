<script lang="ts">
  import type { Habit } from '@/types/habit';
  import type { EditableDayStatus } from '$lib/habits/habitRhythmStatus';
  import HabitRhythmCalendar from '$lib/components/habits/HabitRhythmCalendar.svelte';
  import Surface from '$lib/components/ui/Surface.svelte';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    habit: Habit;
    accent: HabitColorTheme;
    referenceDate: Date;
    timeZone: string;
    pending?: boolean;
    onSetStatus: (dateKey: string, status: EditableDayStatus) => void | Promise<void>;
  };

  const { habit, accent, referenceDate, timeZone, pending = false, onSetStatus }: Props = $props();
</script>

<Surface as="section" padding="lg" class="habit-detail-surface !p-3 sm:!p-4">
  <div class="min-w-0">
    <p class="detail-eyebrow">Rhythm &amp; history</p>
    <h2 class="mt-1 text-xl font-bold tracking-[-0.04em] text-foreground">Your 28-day rhythm</h2>
    <p class="mt-1 max-w-xl text-xs leading-4 text-muted">One calendar for your recent pattern, upcoming days, and history corrections.</p>
  </div>

  <div class="mt-2"><HabitRhythmCalendar {habit} {accent} {referenceDate} {timeZone} {pending} {onSetStatus} /></div>
</Surface>
