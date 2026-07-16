import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['diagnosis', 'measure', 'immobilizer', 'odometers', 'databases']),
    brand: z.string().optional(),
    article: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().default('USD'),
    oldPrice: z.number().optional(),
    inStock: z.boolean().default(true),
    images: z.array(z.string()).default([]),
    pdfFiles: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    specifications: z.record(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().optional(),
    publishedDate: z.date().optional(),
    updatedDate: z.date().optional(),
    order: z.number().optional(),
    featured: z.boolean().default(false),
  }),
});

const categories = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    image: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    order: z.number(),
  }),
});

const brands = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    logo: z.string(),
    description: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    author: z.string().default('Motodok'),
    publishedDate: z.date().optional(),
    updatedDate: z.date().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    publishedDate: z.date().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    price: z.union([z.string(), z.number()]).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    order: z.number().default(10),
  }),
});

export const collections = {
  products,
  categories,
  brands,
  articles,
  news,
  services,
  pages,
};
