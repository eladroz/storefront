import { ONE_DAY } from '../config.ts';

const DISABLE_CDN_CACHE = process.env.DISABLE_CDN_CACHE?.toLowerCase() === 'true';

export type CacheTagOptions = {
	productIds?: string[];
	collectionIds?: string[];
	collectionsMetadata?: boolean;
};

export function applyCacheHeaders(headers: Headers, options?: { cacheTags?: CacheTagOptions }) {
	const cacheHeaders: Record<string, string> = {
		'cache-control': 'public,max-age=0,must-revalidate',
	};
	if (!DISABLE_CDN_CACHE) {
		// 1 day cache, allow up to 5 minutes until next request to revalidate.
		cacheHeaders['cdn-cache-control'] =
			`public,durable,s-maxage=${ONE_DAY},stale-while-revalidate=${60 * 5}`;

		if (options?.cacheTags) {
			const tagsHeaderValue = CacheTags.toHeaderValue(options.cacheTags);
			if (tagsHeaderValue) {
				cacheHeaders['cache-tag'] = tagsHeaderValue;
			}
		}
	}

	Object.entries(cacheHeaders).forEach(([key, value]) => {
		headers.append(key, value);
	});
}

export class CacheTags {
	static forProduct(productId: string) {
		return `pid_${productId}`;
	}
	static forCollection(collectionId: string) {
		return `cid_${collectionId}`;
	}
	static forCollectionsMetadata() {
		return 'collections_metadata';
	}

	static toValues(options: CacheTagOptions): string[] {
		let values: string[] = [];
		if (options.productIds?.length) {
			values = values.concat(options.productIds.map((id) => this.forProduct(id)));
		}
		if (options.collectionIds?.length) {
			values = values.concat(options.collectionIds.map((id) => this.forCollection(id)));
		}
		if (options.collectionsMetadata) {
			values.push(this.forCollectionsMetadata());
		}
		return values;
	}

	static toHeaderValue(options: CacheTagOptions): string | null {
		const values = this.toValues(options);
		return values.length > 0 ? values.join(',') : null;
	}
}
