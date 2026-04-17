import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_SITE_ORIGIN } from '$lib/seo/publicPages';

type SitemapEntry = {
  path: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
};

const STATIC_PAGES: SitemapEntry[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/habit-tracker', priority: '0.9', changefreq: 'monthly' },
  { path: '/streak-tracker', priority: '0.9', changefreq: 'monthly' },
  { path: '/daily-routine-planner', priority: '0.9', changefreq: 'monthly' },
  { path: '/features', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.4', changefreq: 'yearly' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  { path: '/vs/habitica', priority: '0.7', changefreq: 'monthly' },
  { path: '/vs/streaks-app', priority: '0.7', changefreq: 'monthly' },
  { path: '/vs/beeminder', priority: '0.7', changefreq: 'monthly' }
];

function buildSitemap(entries: SitemapEntry[]): string {
  const today = new Date().toISOString().split('T')[0];

  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${PUBLIC_SITE_ORIGIN}${entry.path}</loc>
    <lastmod>${entry.lastmod ?? today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export const prerender = true;

export const GET: RequestHandler = () => {
  const xml = buildSitemap(STATIC_PAGES);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
