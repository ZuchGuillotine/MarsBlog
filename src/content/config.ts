import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default('Benjamin Cox'),
    tags: z.array(z.string()),
    category: z.enum(['transportation', 'energy', 'infrastructure', 'water', 'agriculture', 'radiation-mitigation']),
    subcategory: z.string().optional(),
    readingTime: z.number().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
    }).optional(),
    relatedLocations: z.array(z.string()).default([]),
    citations: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string().optional(),
      authors: z.array(z.string()).optional(),
      year: z.number().optional(),
      publication: z.string().optional(),
    })).default([]),
  }),
});

const locationCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    elevation: z.number(),
    region: z.string(),
    features: z.array(z.string()),
    terraformingPotential: z.object({
      rating: z.number().min(1).max(10),
      factors: z.array(z.string()),
      challenges: z.array(z.string()),
    }),
    resources: z.object({
      water: z.enum(['none', 'trace', 'moderate', 'abundant']).default('none'),
      minerals: z.array(z.string()).default([]),
      atmosphere: z.string().optional(),
    }),
    relatedArticles: z.array(z.string()).default([]),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      credit: z.string().optional(),
    })).default([]),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
    }).optional(),
  }),
});

const projectCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    project: z.string(), // e.g. 'sintering-bricks' — groups log entries by project
    author: z.string().default('Benjamin Cox'),
    tags: z.array(z.string()).default([]),
    videos: z.array(z.object({
      src: z.string(), // path under public/, e.g. /videos/sintering/first-melt.mp4
      caption: z.string().optional(),
      poster: z.string().optional(),
    })).default([]),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    })).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  'blog': blogCollection,
  'locations': locationCollection,
  'projects': projectCollection,
};