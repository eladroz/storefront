import { db, ProductsTable, CollectionsTable } from 'astro:db';
import productsData from '@data/products.json';
import collectionsData from '@data/collections.json';
import type { Collection, Product } from '~/lib/client.types.ts';

const productsArray: Product[] = productsData as Product[];
const collectionsArray: Collection[] = collectionsData as Collection[];
const chunkSize = 100;

type DbProductInsert = typeof ProductsTable.$inferInsert;
type DbCollectionInsert = typeof CollectionsTable.$inferInsert;

export default async function seed() {
	const now = new Date();

	const collectionInserts: DbCollectionInsert[] = collectionsArray.map((c) => ({
		...c,
		description: c.description!,
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
	}));
	await db.insert(CollectionsTable).values(collectionInserts);

	for (let i = 0; i < productsArray.length; i += chunkSize) {
		const chunk = productsArray.slice(i, i + chunkSize);
		const inserts: DbProductInsert[] = chunk.map((p) => ({
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
		}));
		await db.insert(ProductsTable).values(inserts);
	}
}
