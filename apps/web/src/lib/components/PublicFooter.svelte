<script lang="ts">
  import { resolve } from '$app/paths';

  type Props = {
    maxWidth?: string;
  };

  let { maxWidth = 'max-w-6xl' }: Props = $props();
</script>

<footer class="border-t border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-10 sm:px-6">
  <div class="mx-auto grid w-full {maxWidth} gap-6 lg:grid-cols-[1.1fr,1.4fr]">
    <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <p class="text-[10px] uppercase tracking-[0.26em] text-slate-400">Clear daily execution</p>
      <h2 class="mt-3 text-xl font-semibold text-slate-950">Habbit Runner keeps habits tangible.</h2>
      <p class="mt-3 max-w-md text-sm leading-6 text-slate-600">
        Built for offline-first tracking, streak integrity, and practical review without the noise
        of gamified clutter.
      </p>
      <p class="mt-5 text-xs text-slate-400">&copy; {new Date().getFullYear()} Habbit Runner</p>
    </section>

    <section class="rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <nav class="grid gap-5 text-xs text-slate-600 sm:grid-cols-3" aria-label="Footer navigation">
        <div>
          <p class="mb-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">Product</p>
          <div class="flex flex-col gap-2.5">
            <a href={resolve<'/'>('/', {})} class="transition-colors hover:text-slate-950">Home</a>
            <a href={resolve<'/features'>('/features', {})} class="transition-colors hover:text-slate-950">Features</a>
            <a href={resolve<'/blog'>('/blog', {})} class="transition-colors hover:text-slate-950">Blog</a>
            <a href={resolve<'/about'>('/about', {})} class="transition-colors hover:text-slate-950">About</a>
          </div>
        </div>
        <div>
          <p class="mb-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">Guides</p>
          <div class="flex flex-col gap-2.5">
            <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="transition-colors hover:text-slate-950">Habit Tracker</a>
            <a href={resolve<'/streak-tracker'>('/streak-tracker', {})} class="transition-colors hover:text-slate-950">Streak Tracker</a>
            <a href={resolve<'/daily-routine-planner'>('/daily-routine-planner', {})} class="transition-colors hover:text-slate-950">Daily Routine Planner</a>
            <a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'habitica' })} class="transition-colors hover:text-slate-950">vs Habitica</a>
          </div>
        </div>
        <div>
          <p class="mb-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">Legal</p>
          <div class="flex flex-col gap-2.5">
            <a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="transition-colors hover:text-slate-950">Privacy</a>
          </div>
        </div>
      </nav>
    </section>
  </div>
</footer>
