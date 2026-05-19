import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tutorials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutorials' }),
  schema: z.object({
    cardSlug: z.string(),
    title: z.string(),
    updatedAt: z.string(),
  }),
});

export const collections = { tutorials };
