<script lang="ts">
  import { resolve } from '$app/paths';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const { competitor } = data;

  const pageUrl = `${PUBLIC_SITE_ORIGIN}/vs/${competitor.slug}`;

  const seoConfig = {
    title: competitor.tagline,
    description: competitor.description,
    url: pageUrl,
    keywords: competitor.keywords,
    type: 'article' as const,
    publishedAt: '2026-04-16',
    modifiedAt: '2026-04-16'
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: competitor.tagline,
    description: competitor.description,
    url: pageUrl,
    datePublished: '2026-04-16',
    dateModified: '2026-04-16',
    author: { '@type': 'Organization', name: 'Habbit Runner', url: PUBLIC_SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: 'Habbit Runner', url: PUBLIC_SITE_ORIGIN }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Comparisons', item: `${PUBLIC_SITE_ORIGIN}/vs` },
      { '@type': 'ListItem', position: 3, name: `vs ${competitor.name}`, item: pageUrl }
    ]
  };
</script>

<PublicSeoHead {seoConfig} />

<svelte:head>
  <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
</svelte:head>

<div class="min-h-screen bg-white text-gray-900">
  <PublicNav maxWidth="max-w-4xl" />
  <main>
  <!-- Hero -->
  <section class="border-b border-gray-100 bg-gradient-to-br from-violet-50 to-white py-16">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">
        Comparison
      </p>
      <h1 class="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        Habbit Runner vs {competitor.name}
      </h1>
      <p class="mx-auto max-w-2xl text-lg text-gray-600">{competitor.description}</p>
    </div>
  </section>

  <div class="mx-auto max-w-4xl px-4 py-12">
    <!-- Feature comparison table -->
    <section class="mb-16">
      <h2 class="mb-6 text-2xl font-bold text-gray-900">Feature Comparison</h2>
      <div class="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-left">
              <th class="px-6 py-4 font-semibold text-gray-700">Feature</th>
              <th class="px-6 py-4 font-semibold text-violet-700">Habbit Runner</th>
              <th class="px-6 py-4 font-semibold text-gray-700">{competitor.name}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each competitor.features as feature (`${feature.name}`)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-800">{feature.name}</td>
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
                    <span class="text-gray-700">{feature.habbitRunner}</span>
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
                    <span class="text-gray-700">{feature.competitor}</span>
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
      <div class="rounded-2xl border border-violet-100 bg-violet-50 p-8">
        <h2 class="mb-4 text-xl font-bold text-violet-900">Why choose Habbit Runner?</h2>
        <ul class="space-y-3">
          {#each competitor.habbitRunnerStrengths as strength (`${strength}`)}
            <li class="flex items-start gap-2 text-violet-800">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-violet-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              {strength}
            </li>
          {/each}
        </ul>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-gray-50 p-8">
        <h2 class="mb-4 text-xl font-bold text-gray-800">Why {competitor.name} might be better</h2>
        <ul class="space-y-3">
          {#each competitor.competitorStrengths as strength (`${strength}`)}
            <li class="flex items-start gap-2 text-gray-700">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              {strength}
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <!-- Verdict -->
    <section class="mb-16 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 class="mb-4 text-xl font-bold text-gray-900">The Bottom Line</h2>
      <p class="text-gray-700">{competitor.verdict}</p>
    </section>

    <!-- CTA -->
    <section class="rounded-2xl bg-violet-600 px-8 py-10 text-center text-white">
      <h2 class="mb-2 text-2xl font-bold">Try Habbit Runner — Free</h2>
      <p class="mb-6 text-violet-100">No App Store. No subscription. Works offline from day one.</p>
      <a
        href={resolve('/')}
        class="inline-block rounded-xl bg-white px-8 py-3 font-semibold text-violet-700 transition hover:bg-violet-50"
      >
        Get Started
      </a>
    </section>

    <!-- Internal links -->
    <nav class="mt-10 flex flex-wrap justify-center gap-4 text-sm text-violet-600" aria-label="Related pages">
      <a href={resolve('/features')} class="hover:underline">All Features</a>
      <a href={resolve('/about')} class="hover:underline">About Habbit Runner</a>
      <a href={resolve('/blog')} class="hover:underline">Blog</a>
    </nav>
  </div>
  </main>
  <PublicFooter maxWidth="max-w-4xl" />
</div>
