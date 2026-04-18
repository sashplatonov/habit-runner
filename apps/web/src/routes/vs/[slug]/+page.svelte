<script lang="ts">
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { resolve } from '$app/paths';
  import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';
  import type { PageData } from './$types';

  export let data: PageData;
  const { competitor } = data;

  const pageUrl = `${PUBLIC_SITE_ORIGIN}/vs/${competitor.slug}`;

  
</script>

<PublicSeoHead
  title={competitor.tagline}
  description={competitor.description}
  keywords={competitor.keywords}
  pathname={`/vs/${competitor.slug}`}
 />

<svelte:head>
  <script type="application/ld+json">{JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: competitor.tagline,
    description: competitor.description,
    url: pageUrl,
    datePublished: '2026-04-16',
    dateModified: '2026-04-16',
    author: { '@type': 'Organization', name: 'Habbit Runner', url: PUBLIC_SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: 'Habbit Runner', url: PUBLIC_SITE_ORIGIN }
  }).replace(/</g, '\\u003c')}</script>
  <script type="application/ld+json">{JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Comparisons', item: `${PUBLIC_SITE_ORIGIN}/vs` },
      { '@type': 'ListItem', position: 3, name: `vs ${competitor.name}`, item: pageUrl }
    ]
  }).replace(/</g, '\\u003c')}</script>
</svelte:head>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_52%,#f7fbff_100%)] text-gray-900">
  <PublicNav maxWidth="max-w-4xl" />
  <main>
  <!-- Hero -->
  <section class="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(49,105,255,0.16),transparent_34%),radial-gradient(circle_at_84%_14%,rgba(16,179,154,0.14),transparent_24%),linear-gradient(180deg,#f9fcff_0%,#eef4fb_100%)] py-16">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-sky-700">
        Comparison
      </p>
      <h1 class="mb-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        Habbit Runner vs {competitor.name}
      </h1>
      <p class="mx-auto max-w-2xl text-lg leading-8 text-slate-600">{competitor.description}</p>
    </div>
  </section>

  <div class="mx-auto max-w-4xl px-4 py-12">
    <!-- Feature comparison table -->
    <section class="mb-16">
      <h2 class="mb-6 text-2xl font-semibold text-slate-950">Feature Comparison</h2>
      <div class="overflow-x-auto rounded-[1.75rem] border border-slate-200/80 bg-white/92 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-left">
              <th class="px-6 py-4 font-semibold text-slate-700">Feature</th>
              <th class="px-6 py-4 font-semibold text-sky-700">Habbit Runner</th>
              <th class="px-6 py-4 font-semibold text-slate-700">{competitor.name}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each competitor.features as feature (`${feature.name}`)}
              <tr class="hover:bg-slate-50/80">
                <td class="px-6 py-4 font-medium text-slate-800">{feature.name}</td>
                <td class="px-6 py-4">
                  {#if feature.habbitRunner === true}
                    <span class="inline-flex items-center gap-1 font-medium text-green-600">
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.707-4.707a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      Yes
                    </span>
                  {:else if feature.habbitRunner === false}
                    <span class="inline-flex items-center gap-1 text-gray-400">
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                      No
                    </span>
                  {:else}
                    <span class="text-slate-700">{feature.habbitRunner}</span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  {#if feature.competitor === true}
                    <span class="inline-flex items-center gap-1 font-medium text-green-600">
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.707-4.707a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      Yes
                    </span>
                  {:else if feature.competitor === false}
                    <span class="inline-flex items-center gap-1 text-gray-400">
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                      </svg>
                      No
                    </span>
                  {:else}
                    <span class="text-slate-700">{feature.competitor}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Strengths -->
    <section class="mb-16 grid gap-8 sm:grid-cols-2">
      <div class="rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(49,105,255,0.08),rgba(16,179,154,0.08))] p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="mb-4 text-xl font-semibold text-slate-950">Why choose Habbit Runner?</h2>
        <ul class="space-y-3">
          {#each competitor.habbitRunnerStrengths as strength (`${strength}`)}
            <li class="flex items-start gap-2 text-slate-700">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-sky-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              {strength}
            </li>
          {/each}
        </ul>
      </div>

      <div class="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 class="mb-4 text-xl font-semibold text-slate-950">Why {competitor.name} might be better</h2>
        <ul class="space-y-3">
          {#each competitor.competitorStrengths as strength (`${strength}`)}
            <li class="flex items-start gap-2 text-slate-700">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              {strength}
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <!-- Verdict -->
    <section class="mb-16 rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <h2 class="mb-4 text-xl font-semibold text-slate-950">The Bottom Line</h2>
      <p class="text-slate-700">{competitor.verdict}</p>
    </section>

    <!-- CTA -->
    <section class="rounded-[1.75rem] bg-slate-950 px-8 py-10 text-center text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
      <h2 class="mb-2 text-2xl font-semibold">Try Habbit Runner — Free</h2>
      <p class="mb-6 text-slate-300">No App Store. No subscription. Works offline from day one.</p>
      <a
            href={resolve('/', {})}
            class="inline-block rounded-full bg-white px-8 py-3 font-semibold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
          >
            Get Started
          </a>
    </section>

    <!-- Internal links -->
    <nav class="mt-10 flex flex-wrap justify-center gap-4 text-sm text-sky-700" aria-label="Related pages">
      <a href={resolve('/features', {})} class="hover:underline">All Features</a>
      <a href={resolve('/about', {})} class="hover:underline">About Habbit Runner</a>
      <a href={resolve('/blog', {})} class="hover:underline">Blog</a>
    </nav>
  </div>
  </main>
  <PublicFooter maxWidth="max-w-4xl" />
</div>
