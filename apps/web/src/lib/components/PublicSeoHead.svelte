<script lang="ts">
  import JsonLdHead from '$lib/components/JsonLdHead.svelte';
  import {
    buildCanonicalUrl,
    buildFaqSchema,
    buildOrganizationSchema,
    buildSoftwareSchema,
    buildWebsiteSchema,
    PUBLIC_OG_IMAGE_URL,
    PUBLIC_SITE_ORIGIN,
    type FaqItem
  } from '$lib/seo/publicPages';

  type Props = {
    title: string;
    description: string;
    keywords: string;
    pathname: string;
    faq?: FaqItem[];
  };

  let { title, description, keywords, pathname, faq = [] }: Props = $props();

  const metaKeywords = $derived(keywords);
  const canonicalUrl = $derived(buildCanonicalUrl(pathname));
  const hreflangUrl = $derived(`${PUBLIC_SITE_ORIGIN}${pathname}`);
  const isRoot = $derived(pathname === '/');
  const structuredData = $derived.by(() => {
    const schemas: unknown[] = [
      buildOrganizationSchema(),
      buildWebsiteSchema(),
      buildSoftwareSchema(description, pathname)
    ];

    if (faq.length > 0) {
      schemas.push(buildFaqSchema(faq));
    }

    return schemas
      .map((schema, index) => ({
        id: `${pathname}-${index}`,
        payload: JSON.stringify(schema).replace(/</g, '\\u003c')
      }));
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={metaKeywords} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang="en" href={hreflangUrl} />
  {#if isRoot}
    <link rel="alternate" hreflang="x-default" href={PUBLIC_SITE_ORIGIN + '/'} />
  {/if}

  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name" content="Habbit Runner" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={PUBLIC_OG_IMAGE_URL} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={PUBLIC_OG_IMAGE_URL} />
</svelte:head>

{#each structuredData as schema (schema.id)}
  <JsonLdHead payload={schema.payload} />
{/each}