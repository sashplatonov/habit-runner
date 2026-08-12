type JsonLdValue = Record<string, unknown>;

type PublicSeoConfig = {
  title: string;
  description: string;
  keywords: string;
  pathname: string;
  faq?: Array<{ question: string; answer: string }>;
};

function upsertMeta(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertPropertyMeta(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: JsonLdValue) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(data);
}

function faqToSchema(faq: NonNullable<PublicSeoConfig['faq']>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export function applyPublicSeo(config: PublicSeoConfig) {
  const previousTitle = document.title;
  const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
  const previousKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');

  const origin = window.location.origin;
  const canonicalUrl = new URL(config.pathname, origin).toString();
  const ogImageUrl = new URL('/og-image.svg', origin).toString();

  document.title = config.title;
  upsertMeta('description', config.description);
  upsertMeta('keywords', config.keywords);
  upsertMeta('robots', 'index, follow');

  upsertPropertyMeta('og:title', config.title);
  upsertPropertyMeta('og:description', config.description);
  upsertPropertyMeta('og:type', 'website');
  upsertPropertyMeta('og:site_name', 'Habit Runner');
  upsertPropertyMeta('og:url', canonicalUrl);
  upsertPropertyMeta('og:image', ogImageUrl);

  upsertMeta('twitter:card', 'summary_large_image');
  upsertMeta('twitter:title', config.title);
  upsertMeta('twitter:description', config.description);
  upsertMeta('twitter:image', ogImageUrl);

  upsertLink('canonical', canonicalUrl);

  upsertJsonLd('seo-software-application', {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Habit Runner',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    url: canonicalUrl,
    description: config.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  });

  upsertJsonLd('seo-organization', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Habit Runner',
    url: origin,
    logo: ogImageUrl
  });

  upsertJsonLd('seo-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Habit Runner',
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });

  if (config.faq && config.faq.length > 0) {
    upsertJsonLd('seo-faq-page', faqToSchema(config.faq));
  }

  return () => {
    document.title = previousTitle;
    if (previousDescription) {
      upsertMeta('description', previousDescription);
    }
    if (previousKeywords) {
      upsertMeta('keywords', previousKeywords);
    }
  };
}
