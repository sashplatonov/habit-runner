<script lang="ts">
  import { resolve } from '$app/paths';

  type Props = {
    maxWidth?: string;
  };

  let { maxWidth = 'max-w-6xl' }: Props = $props();
</script>

<footer data-theme="cloud" class="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(244,246,241,0.95))] px-4 py-10 sm:px-6">
  <div class="mx-auto grid w-full {maxWidth} gap-6 lg:grid-cols-[1.1fr,1.4fr]">
    <section class="rounded-[1.75rem] border border-border bg-bg-card p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <p class="text-[10px] uppercase tracking-[0.26em] text-muted">Clear daily execution</p>
      <h2 class="mt-3 text-xl font-semibold tracking-tight text-foreground">Habbit Runner keeps habits tangible.</h2>
      <p class="mt-3 max-w-md text-sm leading-6 text-muted">
        Built for reliable tracking, streak integrity, and practical review without the noise
        of gamified clutter.
      </p>
      <p class="mt-5 text-xs text-muted">&copy; {new Date().getFullYear()} Habbit Runner</p>
    </section>

    <section class="rounded-[1.75rem] border border-border bg-bg-card p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <nav class="grid gap-5 text-xs text-muted sm:grid-cols-3" aria-label="Footer navigation">
        <div>
          <p class="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted">Product</p>
          <div class="flex flex-col gap-1">
            <a href={resolve<'/'>('/', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Home</a>
            <a href={resolve<'/features'>('/features', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Features</a>
            <a href={resolve<'/blog'>('/blog', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Blog</a>
            <a href={resolve<'/about'>('/about', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">About</a>
          </div>
        </div>
        <div>
          <p class="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted">Guides</p>
          <div class="flex flex-col gap-1">
            <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Habit Tracker</a>
            <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Streak Tracker</a>
            <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Daily Routine Planner</a>
            <a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'habitica' })} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">vs Habitica</a>
          </div>
        </div>
        <div>
          <p class="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted">Legal</p>
          <div class="flex flex-col gap-2.5">
            <a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="inline-flex min-h-11 items-center transition-colors hover:text-foreground">Privacy</a>
          </div>
        </div>
      </nav>
    </section>
  </div>
</footer>
