import { db, ProductsTable } from 'astro:db';
import productsData from '@data/products.json';
import type { Product } from '~/lib/client.types.ts';

const productsArray: Product[] = Object.values(productsData as Record<string, Product>);

type DbProductInsert = typeof ProductsTable.$inferInsert;

// https://astro.build/db/seed
export default async function seed() {
	const now = new Date();
	const chunkSize = 100;

	for (let i = 0; i < productsArray.length; i += chunkSize) {
		const chunk = productsArray.slice(i, i + chunkSize);

		const inserts: DbProductInsert[] = chunk.map((p) => {
			return {
				id: p.id,
				name: p.name,
				slug: p.slug,
				tagline: p.tagline,
				description: p.description,
				price: p.price,
				discount: p.discount,
				imageUrl: p.imageUrl,
				collectionIds: p.collectionIds,
				createdAt: now,
				updatedAt: now,
			};
		});

		await db.insert(ProductsTable).values(inserts);
	}
}
