import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    sort_order:    z.number(),
    eyebrow:       z.string(),
    title:         z.string(),
    focus:         z.string(),
    price:         z.string(),
    price_note:    z.string().optional(),
    description:   z.string(),
    includes:      z.string(),
    benefits_list: z.array(z.string()),
    stripe_link:   z.string().url(),
    cta_text:      z.string(),
    featured:      z.boolean().default(false),
  }),
});

export const collections = { products };
