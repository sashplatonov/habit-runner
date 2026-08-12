<script lang="ts">
  import { resolve } from '$app/paths';

  type Props = {
    maxWidth?: string;
  };

  let { maxWidth = 'max-w-6xl' }: Props = $props();
</script>

<footer data-theme="cloud" class="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(244,246,241,0.95))] px-4 py-5 sm:px-6">
  <div class="mx-auto flex w-full {maxWidth} flex-col gap-3 rounded-2xl border border-border bg-bg-card px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
    <div class="flex items-center gap-3 text-xs text-muted">
      <span class="font-semibold tracking-tight text-foreground">Habbit Runner</span>
      <span aria-hidden="true" class="text-border-hover">•</span>
      <span>&copy; {new Date().getFullYear()}</span>
    </div>

    <nav class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted sm:justify-end" aria-label="Footer navigation">
      <a href={resolve<'/'>('/', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Home</a>
      <a href={resolve<'/features'>('/features', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Features</a>
      <a href={resolve<'/blog'>('/blog', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Blog</a>
      <a href={resolve<'/about'>('/about', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">About</a>
      <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Habit Tracker</a>
      <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Streak Tracker</a>
      <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Daily Routine Planner</a>
      <a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'habitica' })} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">vs Habitica</a>
      <a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Privacy</a>
    </nav>
  </div>
</footer>
