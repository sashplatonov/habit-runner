import matter from 'gray-matter';
import { marked } from 'marked';

import type { BlogPost } from '$lib/blog/types';

const rawFiles = import.meta.glob<string>('../../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function slugFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.md$/, '');
}

function parsePost(slug: string, raw: string): BlogPost {
  const { data, content: body } = matter(raw);
  const html = marked.parse(body) as string;

  return {
    id: slug,
    slug,
    title: data['title'] as string,
    description: data['description'] as string,
    publishedAt: data['publishedAt'] as string,
    updatedAt: data['updatedAt'] as string | undefined,
    author: data['author'] as string,
    keywords: data['keywords'] as string,
    readingTimeMinutes: data['readingTimeMinutes'] as number,
    content: html,
    category: (data['category'] as string) || undefined,
  };
}

export const BLOG_POSTS: BlogPost[] = Object.entries(rawFiles)
  .map(([path, raw]) => parsePost(slugFromPath(path), raw as string))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getBlogPostSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}