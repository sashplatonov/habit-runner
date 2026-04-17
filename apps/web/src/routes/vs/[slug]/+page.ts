import { error } from '@sveltejs/kit';
import { getCompetitor, getCompetitorSlugs } from '$lib/seo/competitors';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
  getCompetitorSlugs().map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
  const competitor = getCompetitor(params.slug);
  if (!competitor) {
    throw error(404, 'Comparison page not found');
  }
  return { competitor };
};
