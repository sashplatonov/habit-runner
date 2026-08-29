<script lang="ts">
  import { Snowflake } from 'lucide-svelte';
  import Surface from '$lib/components/ui/Surface.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import HabitCompletionControl from '$lib/components/habits/HabitCompletionControl.svelte';
  import type { CelebrationParticle } from '$lib/habits/completionCelebration';
  import type { Habit } from '@/types/habit';

  type Props = {
    habit: Habit;
    label: string;
    completed: boolean;
    target: number;
    count: number;
    accent: string;
    scheduled: boolean;
    frozen: boolean;
    pending?: boolean;
    error?: boolean;
    summary: string;
    progressLabel: string;
    remainingLabel: string;
    recoveryCopy: string;
    animating?: boolean;
    particles?: CelebrationParticle[];
    celebrationLabel?: string;
    onIncrement: () => void | Promise<void>;
    onDecrement: () => void | Promise<void>;
    onToggleFreeze: () => void | Promise<void>;
  };

  let {
    habit,
    label,
    completed,
    target,
    count,
    accent,
    scheduled,
    frozen,
    pending = false,
    error = false,
    summary,
    progressLabel,
    remainingLabel,
    recoveryCopy,
    animating = false,
    particles = [],
    celebrationLabel = '',
    onIncrement,
    onDecrement,
    onToggleFreeze
  }: Props = $props();

  const canDecrement = $derived(count > 0);
  const mainLabel = $derived(habit.type === 'negative' ? `Record slip for ${label}` : completed ? `Undo ${label}` : `Complete ${label}`);
</script>

<Surface as="section" padding="lg" class="space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div class="min-w-0">
      <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Today&apos;s step</p>
      <h2 class="mt-1 text-[1.05rem] font-semibold tracking-[-0.025em] text-foreground">{summary}</h2>
    </div>
    <p class="text-sm font-medium text-muted">{progressLabel} {#if remainingLabel}· {remainingLabel}{/if}</p>
  </div>

  <div class="space-y-3">
    <p class="max-w-sm text-sm leading-6 text-muted">{recoveryCopy}</p>
    <div class="flex flex-wrap items-center gap-2.5">
      <div class="relative">
        {#if animating}
          {#each particles as particle (particle.id)}
            <span
              class="completion-burst-particle"
              style="--tx: {particle.tx}px; --ty: {particle.ty}px; --particle-size: {particle.size}px; --particle-rotate: {particle.rotation}deg; --particle-delay: {particle.delay}ms; --particle-duration: {particle.duration}ms; --particle-color: {particle.color}; background: {particle.color}; border-radius: {particle.radius}; left: 50%; top: 50%; margin-left: calc({particle.size}px / -2); margin-top: calc({particle.size}px / -2);"
            ></span>
          {/each}
          <span class="completion-status-pop" style="color: {accent}">{celebrationLabel}</span>
        {/if}
        <HabitCompletionControl
          label={mainLabel}
          completed={completed}
          target={target}
          count={count}
          accent={accent}
          scheduled={scheduled}
          frozen={frozen}
          pending={pending}
          error={error}
          disabled={!scheduled}
          class="!min-h-11 !min-w-11 !rounded-[1rem] !px-0"
          onToggle={onIncrement}
        />
      </div>
      <IconButton
        ariaLabel={habit.type === 'negative' ? 'Remove one slip' : 'Remove one completion'}
        title={habit.type === 'negative' ? 'Remove one slip' : 'Remove one completion'}
        disabled={!canDecrement || frozen || pending}
        onClick={onDecrement}
      >
        <span class="text-lg leading-none">-</span>
      </IconButton>
      <IconButton ariaLabel={frozen ? 'Unfreeze today' : 'Freeze today'} title={frozen ? 'Unfreeze today' : 'Freeze today'} active={frozen} toggle={true} disabled={habit.archived || pending} onClick={onToggleFreeze}>
        <Snowflake size={16} aria-hidden="true" />
      </IconButton>
    </div>
  </div>
</Surface>
