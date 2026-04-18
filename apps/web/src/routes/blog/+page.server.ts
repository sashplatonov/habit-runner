import { BLOG_POSTS } from '$lib/blog/posts.server';

export const prerender = true;

export function load() {
  const visible = BLOG_POSTS.filter((post) => ((post.category ?? '').toLowerCase() !== 'tech'));

  return {
    posts: visible.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      publishedAt: post.publishedAt,
      author: post.author,
      readingTimeMinutes: post.readingTimeMinutes,
      keywords: post.keywords,
      coverImage: post.coverImage,
    })),
  };
}