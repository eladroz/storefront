import type { APIRoute } from 'astro';
import { CollectionsTable, db, gt, or, ProductsTable, JobsTable, eq } from 'astro:db';
import { CacheTags } from '~/lib/headers.ts';
import { purgeCache } from '@netlify/functions';

const SITE_ID = process.env.SITE_ID;
const JOB_NAME = 'invalidate-tags';
const MAX_TAGS_TO_PURGE = 100;

async function updateRun(options: { now: Date; info: object; isFirstRun: boolean }) {
	if (options.isFirstRun) {
		await db
			.insert(JobsTable)
			.values({ name: JOB_NAME, lastRun: options.now, lastRunInfo: options.info });
	} else {
		await db
			.update(JobsTable)
			.set({ lastRun: options.now, lastRunInfo: options.info })
			.where(eq(JobsTable.name, JOB_NAME));
	}
}

const successString = JSON.stringify({
	success: true,
});

// TODO only run if secret token is passed
export const GET: APIRoute = async () => {
	const now = new Date();

	const lastRunResponse = await db.select().from(JobsTable).where(eq(JobsTable.name, JOB_NAME));
	const lastRun = lastRunResponse.length ? lastRunResponse[0] : null;

	if (!lastRun) {
		await updateRun({ now, info: { message: 'first run' }, isFirstRun: true });
		return new Response(successString);
	}

	const lastRunTime = lastRun.lastRun;
	const modifiedCollections = await db
		.select({ id: CollectionsTable.id })
		.from(CollectionsTable)
		.where(
			or(
				gt(CollectionsTable.createdAt, lastRunTime),
				gt(CollectionsTable.updatedAt, lastRunTime),
				gt(CollectionsTable.deletedAt, lastRunTime),
			),
		);
	const modifiedCollectionIdsSet = new Set<string>(modifiedCollections.map((c) => c.id));

	const modifiedProducts = await db
		.select()
		.from(ProductsTable)
		.where(
			or(
				gt(ProductsTable.createdAt, lastRunTime),
				gt(ProductsTable.updatedAt, lastRunTime),
				gt(ProductsTable.deletedAt, lastRunTime),
			),
		);
	const modifiedProductIds = modifiedProducts.map((p) => p.id);

	modifiedProducts.forEach((p) => {
		(p.collectionIds as string[]).forEach((cid) => modifiedCollectionIdsSet.add(cid));
	});

	const modifiedCollectionIds = [...modifiedCollectionIdsSet.values()];

	if (modifiedCollectionIds.length === 0 && modifiedProductIds.length === 0) {
		await updateRun({ now, info: { message: 'no updates' }, isFirstRun: false });
		return new Response(successString);
	}

	if (modifiedProductIds.length > 0) {
		/* TODO:
		Figure out which products have moved between collections (if any), so we can update not just 
		these products' current collections, but also their prev. collections.
		To do this, calculate all collection->product IDs lists, and compare to prev. stored calculation
		*/
	}

	const tags = CacheTags.toValues({
		productIds: modifiedProductIds,
		collectionIds: modifiedCollectionIds,
		collectionsMetadata: !!modifiedCollections?.length,
	});

	let message = 'Found updates';

	if (SITE_ID) {
		if (tags.length > MAX_TAGS_TO_PURGE) {
			message += `. Too many tags (${tags.length}), so purging site`;
			await purgeCache();
		} else {
			await purgeCache({ tags });
		}
	} else {
		message += '. No SITE_ID environment variable found, so cannot actually purge';
	}

	// TODO handle errors, write last error time/message separately from last success info
	await updateRun({ now, info: { message, tags }, isFirstRun: false });
	return new Response(successString);
};
