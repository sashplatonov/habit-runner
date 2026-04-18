export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  keywords: string;
  readingTimeMinutes: number;
  content: string;
  category?: string;
  coverImage?: string;
};