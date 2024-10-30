import { defineDb, defineTable, column } from 'astro:db';

const ProductsTable = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		name: column.text(),
		slug: column.text(),
		tagline: column.text({ optional: true }),
		description: column.text({ optional: true }),
		price: column.number(),
		discount: column.number(),
		imageUrl: column.text(),
		collectionIds: column.json({ optional: true }),
		createdAt: column.date(),
		updatedAt: column.date(),
		deletedAt: column.date({ optional: true }),
	},
	indexes: [{ on: ['price'] }, { on: ['updatedAt'] }],
});

const CollectionsTable = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		name: column.text(),
		description: column.text(),
		slug: column.text({ optional: true }),
		imageUrl: column.text({ optional: true }),
		createdAt: column.date(),
		updatedAt: column.date(),
		deletedAt: column.date({ optional: true }),
	},
});

const JobsTable = defineTable({
	columns: {
		name: column.text({ primaryKey: true }),
		lastSuccess: column.json({ optional: true }),
		lastFailure: column.json({ optional: true }),
	},
});

// https://astro.build/db/config
export default defineDb({
	tables: { ProductsTable, CollectionsTable, JobsTable },
});
