import { CollectionsTable, db, gt, or, ProductsTable } from 'astro:db';
import { CacheTags } from '~/lib/headers.ts';
import { purgeCache } from '@netlify/functions';
import { REVALIDATE_JOB } from '~/config.ts';
import { getJobStatus, saveJobStatus, makeResponse, type JobTrigger } from './index.ts';

const SITE_ID = import.meta.env.SITE_ID;
const MAX_TAGS_TO_PURGE = 100;

async function getModifiedTags(sinceDate: Date) {
	const modifiedCollections = await db
		.select({ id: CollectionsTable.id })
		.from(CollectionsTable)
		.where(
			or(
				gt(CollectionsTable.createdAt, sinceDate),
				gt(CollectionsTable.updatedAt, sinceDate),
				gt(CollectionsTable.deletedAt, sinceDate),
			),
		);
	const collectionsMetadataWasModified = modifiedCollections.length > 0;

	const modifiedProducts = await db
		.select()
		.from(ProductsTable)
		.where(
			or(
				gt(ProductsTable.createdAt, sinceDate),
				gt(ProductsTable.updatedAt, sinceDate),
				gt(ProductsTable.deletedAt, sinceDate),
			),
		);

	const allAffectedCollectionIds = new Set<string>(modifiedCollections.map((c) => c.id));
	modifiedProducts.forEach((p) => {
		(p.collectionIds as string[]).forEach((collectionId) =>
			allAffectedCollectionIds.add(collectionId),
		);
	});

	if (modifiedProducts.length > 0) {
		/* TODO:
		Figure out which products have moved between collections (if any), so we can update not just 
		these products' current collections, but also their prev. collections.
		To do this, calculate all collection->product IDs lists, and compare to prev. stored calculation
		(as an optimization, it's enough to store the hash of all product IDs per collection)
		*/
	}

	return CacheTags.toValues({
		productIds: modifiedProducts.map((p) => p.id),
		collectionIds: [...allAffectedCollectionIds.values()],
		collectionsMetadataWasModified,
	});
}

// TOOD pull all common job logic out, specific jobs should be template classes
export const revalidateJob = async (options?: { trigger: JobTrigger }) => {
	const now = new Date();
	const trigger = options?.trigger;
	try {
		const lastJobStatus = await getJobStatus(REVALIDATE_JOB);

		if (!lastJobStatus || !lastJobStatus.lastSuccess) {
			const message = 'first run';
			await saveJobStatus(REVALIDATE_JOB, {
				date: now,
				info: { message },
				isFirstRun: true,
				trigger,
			});
			return makeResponse({ message });
		}

		const tags = await getModifiedTags(lastJobStatus.lastSuccess.date);
		const messages: string[] = [];
		if (tags.length > 0) {
			messages.push('Found updates');
			if (SITE_ID) {
				if (tags.length > MAX_TAGS_TO_PURGE) {
					messages.push(`Too many tags (${tags.length}), so purging whole site`);
					await purgeCache();
				} else {
					await purgeCache({ tags });
				}
			} else {
				messages.push('No SITE_ID environment variable found, so cannot actually purge');
			}
		} else {
			messages.push('No updates found');
		}

		const message = messages.join('. ');
		await saveJobStatus(REVALIDATE_JOB, { date: now, info: { message, tags }, trigger });
		return makeResponse({ message, data: { tags } });
	} catch (e) {
		let message = e instanceof Error ? e.message : 'unknown error';
		try {
			await saveJobStatus(REVALIDATE_JOB, { error: true, date: now, info: { message }, trigger });
		} catch (e) {
			message += '. Failed to store failure back to DB.';
		}
		return makeResponse({ error: true, message });
	}
};
