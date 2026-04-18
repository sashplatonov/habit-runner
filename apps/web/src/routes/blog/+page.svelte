<script lang="ts">
  import { resolve } from '$app/paths';
  import JsonLdHead from '$lib/components/JsonLdHead.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';

  let { data } = $props();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${PUBLIC_SITE_ORIGIN}/blog` }
    ]
  };

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
</script>

<PublicSeoHead
  title="Blog — Habbit Runner"
  description="Guides, comparisons, and technical articles about habit tracking, offline PWAs, and productivity."
  keywords="habit tracker blog, offline habit tracker guide, pwa habit tracking, sveltekit dexie blog"
  pathname="/blog"
/>

<JsonLdHead payload={JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c')} />

<div class="min-h-screen bg-white text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
    <nav class="mb-6 flex items-center gap-2 text-xs text-slate-500">
      <a href={resolve<'/'>('/', {})} class="hover:text-slate-900">Home</a>
      <span>/</span>
      <span class="text-slate-900">Blog</span>
    </nav>

    <h1 class="text-3xl font-semibold text-slate-900">Blog</h1>
    <p class="mt-3 text-base text-slate-600">
      Guides, technical articles, and comparisons about habit tracking and offline-first apps.
    </p>

    <div class="mt-10 space-y-6">
      {#each data.posts as post (post.id)}
        <article class="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
          {#if post.coverImage}
            <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: post.slug })} tabindex="-1" aria-hidden="true">
              <img src={post.coverImage} alt={post.title} class="w-full h-44 object-cover rounded-xl mb-4" loading="lazy" width="1200" height="630" />
            </a>
          {/if}
          <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: post.slug })}>
            <h2 class="text-lg font-semibold text-slate-900 hover:text-cyan-700 transition-colors">
              {post.title}
            </h2>
          </a>
          <p class="mt-2 text-sm text-slate-600">{post.description}</p>
          <div class="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <span>{formatDate(post.publishedAt)}</span>
            <span>{post.readingTimeMinutes} min read</span>
            <span>{post.author}</span>
          </div>
          <div class="mt-3">
            <a
              href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: post.slug })}
              class="text-xs text-cyan-700 underline hover:text-cyan-900"
            >
              Read article →
            </a>
          </div>
        </article>
      {/each}
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
