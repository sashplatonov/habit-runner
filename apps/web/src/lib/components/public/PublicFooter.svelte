<script lang="ts">
  import { resolve } from '$app/paths';
  import PublicCta from '$lib/components/public/PublicCta.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    cta?: Snippet;
  };

  const { cta }: Props = $props();

  const featuresHref = resolve('/features', {});
  const blogHref = resolve('/blog', {});
  const aboutHref = resolve('/about', {});
  const habitTrackerHref = resolve('/habit-tracker', {});
  const streakTrackerHref = resolve('/streak-tracker', {});
  const dailyPlannerHref = resolve('/daily-routine-planner', {});
  const vsHabiticaHref = resolve('/vs/[slug]', { slug: 'habitica' });
  const vsStreaksHref = resolve('/vs/[slug]', { slug: 'streaks-app' });
  const vsBeeminderHref = resolve('/vs/[slug]', { slug: 'beeminder' });
  const privacyHref = resolve('/privacy-policy', {});
</script>

<footer class="border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(239,246,255,0.9))] px-4 py-10 sm:px-6">
  <div class="mx-auto w-full max-w-6xl">
    <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Product</p>
        <ul class="mt-3 space-y-2">
          <li><a href={featuresHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Features</a></li>
          <li><a href={blogHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Blog</a></li>
          <li><a href={aboutHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">About</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Tools</p>
        <ul class="mt-3 space-y-2">
          <li><a href={habitTrackerHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Habit Tracker</a></li>
          <li><a href={streakTrackerHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Streak Tracker</a></li>
          <li><a href={dailyPlannerHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Daily Routine Planner</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Compare</p>
        <ul class="mt-3 space-y-2">
          <li><a href={vsHabiticaHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">vs Habitica</a></li>
          <li><a href={vsStreaksHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">vs Streaks</a></li>
          <li><a href={vsBeeminderHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">vs Beeminder</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Legal</p>
        <ul class="mt-3 space-y-2">
          <li><a href={privacyHref} class="text-xs text-slate-600 transition-colors hover:text-slate-900">Privacy Policy</a></li>
        </ul>
        <div class="mt-6 flex flex-col gap-2">
          {#if cta}
            {@render cta()}
          {:else}
            <a href={resolve('/', {})} class="text-xs text-cyan-700 underline">Get Started</a>
          {/if}
        </div>
      </div>
    </div>
    <p class="mt-8 text-center text-[10px] text-slate-400">Built for momentum, not theatrics.</p>
  </div>
</footer>
