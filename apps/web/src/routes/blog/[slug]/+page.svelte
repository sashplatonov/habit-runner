<script lang="ts">
  import { resolve } from '$app/paths';
  import JsonLdHead from '$lib/components/JsonLdHead.svelte';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';

  let { data } = $props();
  const post = $derived(data.post);

  const articleSchemaPayload = $derived.by(() => JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: PUBLIC_SITE_ORIGIN
    },
    publisher: {
      '@type': 'Organization',
      name: 'Habbit Runner',
      url: PUBLIC_SITE_ORIGIN,
      logo: { '@type': 'ImageObject', url: `${PUBLIC_SITE_ORIGIN}/og-image.svg` }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${PUBLIC_SITE_ORIGIN}/blog/${post.slug}`
    }
  }).replace(/</g, '\\u003c'));

  const breadcrumbSchemaPayload = $derived.by(() => JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: PUBLIC_SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${PUBLIC_SITE_ORIGIN}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${PUBLIC_SITE_ORIGIN}/blog/${post.slug}` }
    ]
  }).replace(/</g, '\\u003c'));

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
</script>

<PublicSeoHead
  title={post.title + ' — Habbit Runner Blog'}
  description={post.description}
  keywords={post.keywords}
  pathname={'/blog/' + post.slug}
/>

<svelte:head>
  <meta property="og:type" content="article" />
  <meta property="article:published_time" content={post.publishedAt} />
  <meta property="article:author" content={post.author} />
</svelte:head>

<JsonLdHead payload={articleSchemaPayload} />
<JsonLdHead payload={breadcrumbSchemaPayload} />

<div class="min-h-screen bg-[#f7f8f4] text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
    <nav class="mb-6 flex items-center gap-2 text-xs text-slate-500">
      <a href={resolve<'/'>('/', {})} class="hover:text-slate-900">Home</a>
      <span>/</span>
      <a href={resolve<'/blog'>('/blog', {})} class="hover:text-slate-900">Blog</a>
      <span>/</span>
      <span class="truncate max-w-[200px] text-slate-900">{post.title}</span>
    </nav>

    <header class="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-8">
      <p class="text-[10px] uppercase tracking-[0.28em] text-slate-400">Article</p>
      <h1 class="mt-4 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        {post.title}
      </h1>
      <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readingTimeMinutes} min read</span>
        <span>{post.author}</span>
      </div>
      <p class="mt-4 text-base text-slate-600">{post.description}</p>
      {#if post.coverImage}
        <img src={post.coverImage} alt={post.title} class="mt-6 w-full rounded-2xl border border-slate-200" loading="eager" width="1200" height="630" />
      {/if}
    </header>

    {#if post.content}
      <div class="prose prose-slate mt-8 max-w-none rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 text-base leading-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-10">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- content is static, defined in posts.ts, not user input -->
        {@html post.content}
      </div>
    {:else}
      <div class="mt-10 rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-6 text-sm text-slate-500 italic shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        Full article content is loading. Check back shortly.
      </div>
    {/if}

    <div class="mt-8 rounded-[1.5rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:p-8">
      <p class="text-base leading-7 text-slate-300">
        Ready to try one small change?
        <a href={resolve<'/'>('/', {})} class="ml-1 font-semibold text-emerald-300 underline underline-offset-4">Open Habbit Runner</a>
      </p>
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
