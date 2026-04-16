<script lang="ts">
  import {
    buildCanonicalUrl,
    buildFaqSchema,
    buildOrganizationSchema,
    buildSoftwareSchema,
    buildWebsiteSchema,
    PUBLIC_OG_IMAGE_URL,
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

  const canonicalUrl = $derived(buildCanonicalUrl(pathname));
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
  <meta name="keywords" content={keywords} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={canonicalUrl} />

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

  {#each structuredData as schema (schema.id)}
    <script type="application/ld+json">{schema.payload}</script>
  {/each}
</svelte:head>