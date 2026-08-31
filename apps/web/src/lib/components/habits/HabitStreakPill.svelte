<script lang="ts">
  import { Flame, SnowflakeIcon } from 'lucide-svelte';

  type Props = {
    streak: number;
    missedScheduledDays: number;
  };

  const { streak, missedScheduledDays }: Props = $props();
  const hasActiveStreak = $derived(streak > 0);
  const displayedDays = $derived(hasActiveStreak ? streak : missedScheduledDays);
  const label = $derived(
    hasActiveStreak
      ? `${streak} day streak`
      : `${missedScheduledDays} consecutive scheduled days missed`
  );
</script>

<span
  class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-black tabular-nums {hasActiveStreak ? 'border-orange-400/25 bg-orange-400/10 text-orange-500' : 'border-sky-400/25 bg-sky-400/10 text-sky-600'}"
  aria-label={label}
  data-streak-pill
  data-streak-kind={hasActiveStreak ? 'fire' : 'snowflake'}
>
  {#if hasActiveStreak}
    <Flame size={14} aria-hidden="true" />
  {:else}
    <SnowflakeIcon size={14} aria-hidden="true" />
  {/if}
  <span class="text-foreground">{displayedDays}</span>
</span>
