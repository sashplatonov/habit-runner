<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowRight, ArrowUpRight, Check, Circle } from 'lucide-svelte';
  import { startOAuthLogin } from '$lib/auth/oauth';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import PublicCta from '$lib/components/public/PublicCta.svelte';
  import PublicFaq from '$lib/components/public/PublicFaq.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import { PUBLIC_LANDING_SEO } from '$lib/seo/publicPages';

  type Props = { redirecting?: boolean };
  let { redirecting = false }: Props = $props();
</script>

<PublicSeoHead
  title={PUBLIC_LANDING_SEO.title}
  description={PUBLIC_LANDING_SEO.description}
  keywords={PUBLIC_LANDING_SEO.keywords}
  pathname={PUBLIC_LANDING_SEO.pathname}
  faq={PUBLIC_LANDING_SEO.faq}
/>

<div data-theme="cloud" class="min-h-screen overflow-x-clip bg-[#f7f8f4] text-foreground">
  <PublicNav />

  <main>
    <section class="border-b border-border/70 bg-[radial-gradient(circle_at_12%_8%,rgba(78,99,216,0.16),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(35,131,93,0.13),transparent_27%),#f7f8f4]">
      <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <p class="mb-5 inline-flex items-center gap-2 rounded-full border border-progress/20 bg-bg-card px-3 py-2 text-xs font-semibold text-progress">
            <Circle size={9} fill="currentColor" aria-hidden="true" />
            Try it before you sign in
          </p>
          <h1 class="max-w-2xl text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground">
            Keep the next good habit close.
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Habit Runner gives your day a clear place to start, a simple way to check in, and enough context to notice what is changing.
          </p>
          <div class="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <a
              href={resolve('/showcase', {})}
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-progress px-5 py-3 text-sm font-semibold text-bg-primary shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-progress/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-progress"
            >
              Open the interactive demo
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a
              href="https://t.me/habbit_runner_bot?profile"
              target="_blank"
              rel="noreferrer"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-bg-card px-5 py-3 text-sm font-semibold text-foreground transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-progress/30 hover:text-progress focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-progress"
            >
              Open in Telegram
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <PublicCta onclick={startOAuthLogin} variant="secondary">Sign in with Google</PublicCta>
          </div>
          <p class="mt-4 text-sm text-muted">No account is needed to look around the sample. Also available in Telegram Mini App.</p>
        </div>

        <figure class="relative overflow-hidden rounded-[2rem] border border-border bg-bg-card p-4 shadow-[0_28px_80px_rgba(15,23,42,0.14)] sm:p-6">
          <div class="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Today</p>
              <p class="mt-1 text-xl font-semibold text-foreground">A lighter list to return to</p>
            </div>
            <span class="rounded-full bg-progress/10 px-3 py-1.5 text-xs font-semibold text-progress">3 of 5</span>
          </div>
          <div class="space-y-3">
            {#each [
              { label: 'Morning pages', meta: 'Writing · 10 min', done: true },
              { label: 'Take a short walk', meta: 'Movement · 20 min', done: true },
              { label: 'Read before bed', meta: 'Evening · 15 min', done: false }
            ] as habit, i (habit.label + '-' + i)}
              <div class="flex items-center gap-3 rounded-2xl border border-border bg-bg-secondary/70 p-3">
                <span class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${habit.done ? 'bg-progress text-bg-primary' : 'bg-bg-card text-muted'}`}>
                  {#if habit.done}<Check size={18} strokeWidth={3} aria-hidden="true" />{:else}<Circle size={18} aria-hidden="true" />{/if}
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-sm font-semibold text-foreground">{habit.label}</span>
                  <span class="mt-1 block truncate text-xs text-muted">{habit.meta}</span>
                </span>
              </div>
            {/each}
          </div>
          <figcaption class="mt-5 text-xs leading-5 text-muted">A quick check-in first. Deeper progress views are there when you want them.</figcaption>
        </figure>
      </div>
    </section>

    {#if redirecting}
      <div class="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <p role="status" class="rounded-2xl border border-border bg-bg-card px-4 py-3 text-sm text-muted shadow-sm">
          Restoring your session and opening your dashboard…
        </p>
      </div>
    {/if}

    <section class="border-b border-border/70 bg-bg-card px-4 py-12 sm:px-6 sm:py-16">
      <div class="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-progress">The useful middle</p>
          <h2 class="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-foreground">Enough detail to learn. Not enough noise to get lost.</h2>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <article class="rounded-2xl border border-border bg-bg-secondary/70 p-4">
            <h3 class="font-semibold text-foreground">See today</h3>
            <p class="mt-2 text-sm leading-6 text-muted">Keep the habits that matter now in one place.</p>
          </article>
          <article class="rounded-2xl border border-border bg-bg-secondary/70 p-4">
            <h3 class="font-semibold text-foreground">Notice patterns</h3>
            <p class="mt-2 text-sm leading-6 text-muted">Use streaks and trends as clues, not pressure.</p>
          </article>
          <article class="rounded-2xl border border-border bg-bg-secondary/70 p-4">
            <h3 class="font-semibold text-foreground">Adjust gently</h3>
            <p class="mt-2 text-sm leading-6 text-muted">Change a target when real life changes first.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="border-b border-border/70 bg-[#f0f3ed] px-4 py-12 sm:px-6 sm:py-16">
      <div class="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-progress">Start small</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">You can decide how much you want to see.</h2>
          <p class="mt-3 max-w-lg text-base leading-7 text-muted">Begin with one habit, then use the detail that helps you make the next week a little more workable.</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <a href={resolve('/habit-tracker', {})} class="inline-flex min-h-11 items-center rounded-full border border-border bg-bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-progress/30 hover:text-progress">Explore habit tracking</a>
            <a href={resolve('/blog', {})} class="inline-flex min-h-11 items-center rounded-full px-2 py-2 text-sm font-semibold text-progress underline underline-offset-4">Read the field notes</a>
          </div>
        </div>
        <div class="rounded-[1.75rem] border border-border bg-bg-card p-5 shadow-sm sm:p-6">
          <h3 class="text-lg font-semibold text-foreground">Questions, answered plainly</h3>
          <div class="mt-4"><PublicFaq items={PUBLIC_LANDING_SEO.faq.slice(0, 4)} /></div>
        </div>
      </div>
    </section>
  </main>

  <PublicFooter />
</div>
