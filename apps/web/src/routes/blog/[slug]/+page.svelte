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

<div class="min-h-screen bg-white text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
    <nav class="mb-6 flex items-center gap-2 text-xs text-slate-500">
      <a href={resolve<'/'>('/', {})} class="hover:text-slate-900">Home</a>
      <span>/</span>
      <a href={resolve<'/blog'>('/blog', {})} class="hover:text-slate-900">Blog</a>
      <span>/</span>
      <span class="truncate max-w-[200px] text-slate-900">{post.title}</span>
    </nav>

    <header>
      <h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
        {post.title}
      </h1>
      <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span>{formatDate(post.publishedAt)}</span>
        <span>{post.readingTimeMinutes} min read</span>
        <span>{post.author}</span>
      </div>
      <p class="mt-4 text-base text-slate-600">{post.description}</p>
    </header>

    {#if post.content}
      <div class="prose prose-slate mt-10 max-w-none text-sm">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- content is static, defined in posts.ts, not user input -->
        {@html post.content}
      </div>
    {:else}
      <div class="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 italic">
        Full article content is loading. Check back shortly.
      </div>
    {/if}

    <div class="mt-10 border-t border-slate-200 pt-8">
      <p class="text-sm text-slate-600">
        Start tracking habits offline today —
        <a href={resolve<'/'>('/', {})} class="text-cyan-700 underline">Try Habbit Runner free</a>
      </p>
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
