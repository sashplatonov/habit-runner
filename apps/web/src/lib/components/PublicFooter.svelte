<script lang="ts">
  import { resolve } from '$app/paths';

  type Props = {
    maxWidth?: string;
  };

  let { maxWidth = 'max-w-6xl' }: Props = $props();
</script>

<footer class="border-t border-slate-200 bg-[#f8fafc] px-4 py-8 sm:px-6">
  <div class="mx-auto flex w-full {maxWidth} flex-wrap items-center justify-between gap-4">
    <p class="text-xs text-slate-400">&copy; {new Date().getFullYear()} Habbit Runner</p>
    <nav class="flex flex-wrap gap-5 text-xs text-slate-500" aria-label="Footer navigation">
      <a href={resolve<'/'>('/', {})} class="transition-colors hover:text-slate-900">Home</a>
      <a href={resolve<'/features'>('/features', {})} class="transition-colors hover:text-slate-900">Features</a>
      <a href={resolve<'/blog'>('/blog', {})} class="transition-colors hover:text-slate-900">Blog</a>
      <a href={resolve<'/about'>('/about', {})} class="transition-colors hover:text-slate-900">About</a>
      <a href={resolve<'/habit-tracker'>('/habit-tracker', {})} class="transition-colors hover:text-slate-900">Habit Tracker</a>
      <a href={resolve<'/vs/[slug]'>('/vs/[slug]', { slug: 'habitica' })} class="transition-colors hover:text-slate-900">vs Habitica</a>
      <a href={resolve<'/privacy-policy'>('/privacy-policy', {})} class="transition-colors hover:text-slate-900">Privacy</a>
    </nav>
  </div>
</footer>
