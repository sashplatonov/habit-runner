import { error } from '@sveltejs/kit';

import { getBlogPost, getBlogPostSlugs } from '$lib/blog/posts.server';

export const prerender = true;

export function entries() {
  return getBlogPostSlugs().map((slug) => ({ slug }));
}

export function load({ params }) {
  const post = getBlogPost(params.slug);

  if (!post) {
    throw error(404, 'Blog post not found');
  }

  return { post };
}