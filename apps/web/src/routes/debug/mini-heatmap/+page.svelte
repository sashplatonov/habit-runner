<script lang="ts">
  import MiniHeatmap from '$lib/components/MiniHeatmap.svelte';
  import { toCompletionKey } from '@/lib/completionKey';
  import type { HabitColor } from '@/types/habit';

  const today = new Date();
  const completions: Record<string, number> = {};

  // build 30 days of sample completions (randomized for visibility)
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (29 - i));
    completions[toCompletionKey(d)] = Math.random() > 0.5 ? 1 : 0;
  }

  const color: HabitColor = 'blue';
</script>

<svelte:head>
  <title>Debug — MiniHeatmap</title>
</svelte:head>

<main class="p-6">
  <h1 class="text-lg font-semibold mb-4">Debug MiniHeatmap</h1>

  <div class="rounded-lg border border-border bg-bg-card p-4 inline-block">
    <MiniHeatmap completions={completions} dailyTarget={1} color={color} />
  </div>

  <section class="mt-4">
    <h2 class="text-sm font-medium mb-2">Sample completion keys</h2>
    <pre class="text-xs bg-bg-secondary rounded p-2 max-w-[720px] overflow-auto">
{JSON.stringify(Object.keys(completions).slice(0, 12), null, 2)}
    </pre>
  </section>
</main>
