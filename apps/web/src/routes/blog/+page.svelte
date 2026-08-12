<script lang="ts">
  import { resolve } from '$app/paths';
  import JsonLdHead from '$lib/components/JsonLdHead.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';

  let { data } = $props();
  const lead = $derived(data.posts[0]);
  const remainingPosts = $derived(data.posts.slice(1));

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
  description="Practical guides, comparisons, and notes about habit tracking and everyday routines."
  keywords="habit tracker blog, habit tracking guide, routine planning, consistency"
  pathname="/blog"
/>

<JsonLdHead payload={JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c')} />

<div class="min-h-screen bg-[#f7f8f4] text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
    <nav class="mb-6 flex items-center gap-2 text-xs text-slate-500">
      <a href={resolve<'/'>('/', {})} class="hover:text-slate-900">Home</a>
      <span>/</span>
      <span class="text-slate-900">Blog</span>
    </nav>

    <section class="grid gap-6 rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Field notes</p>
        <h1 class="mt-4 text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl">Blog</h1>
      </div>
      <p class="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
        Practical ideas for routines, streaks, and the days when a perfect plan is not on the menu.
      </p>
    </section>

    {#if lead}
      <article class="mt-8 grid gap-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {#if lead.coverImage}
          <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: lead.slug })} aria-label={`Read ${lead.title}`}>
            <img src={lead.coverImage} alt="" class="aspect-[1200/630] w-full rounded-xl object-cover" loading="eager" width="1200" height="630" />
          </a>
        {/if}
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Latest note</p>
          <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: lead.slug })}>
            <h2 class="mt-3 text-2xl font-semibold leading-tight text-slate-950 hover:text-emerald-700 sm:text-3xl">{lead.title}</h2>
          </a>
          <p class="mt-3 text-base leading-7 text-slate-600">{lead.description}</p>
          <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>{formatDate(lead.publishedAt)}</span><span>{lead.readingTimeMinutes} min read</span>
          </div>
          <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: lead.slug })} class="mt-5 inline-flex min-h-11 items-center font-semibold text-emerald-700 underline underline-offset-4">Read the latest note →</a>
        </div>
      </article>
    {/if}

    <div class="mt-8 grid gap-3 sm:grid-cols-2">
      {#each remainingPosts as post (post.id)}
        <article data-testid="blog-post-card" class="grid gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-sm transition-[transform,border-color] hover:-translate-y-0.5 hover:border-slate-300 sm:grid-cols-[9rem_1fr] sm:items-start sm:p-5">
          {#if post.coverImage}
            <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: post.slug })} aria-label={`Read ${post.title}`} class="sm:row-span-3">
              <img src={post.coverImage} alt="" class="aspect-[1200/630] w-full rounded-xl object-cover" loading="lazy" width="1200" height="630" />
            </a>
          {/if}
          <div data-testid="blog-post-card-copy" class="min-w-0">
            <a href={resolve<'/blog/[slug]'>('/blog/[slug]', { slug: post.slug })}>
              <h2 class="text-lg font-semibold leading-tight text-slate-900 transition-colors hover:text-emerald-700">
                {post.title}
              </h2>
            </a>
            <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.description}</p>
            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>{formatDate(post.publishedAt)}</span><span>{post.readingTimeMinutes} min read</span>
            </div>
          </div>
        </article>
      {/each}
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
