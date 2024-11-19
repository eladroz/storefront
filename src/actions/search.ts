import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getProducts, type Product } from 'storefront:client';

const MAX_RESULTS = 25;

type SearchResponse = {
	items: Product[];
};

export const search = {
	simple: defineAction({
		input: z.object({
			query: z.string().optional(),
		}),
		handler: async (input) => {
			const result = await getProducts({ query: { search: input.query, limit: MAX_RESULTS } });
			const items = result.data?.items || [];
			return { items } as SearchResponse;
		},
	}),
};
