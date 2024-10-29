export const MAX_QUANTITY = 20;
export const ONE_DAY = 60 * 60 * 24;

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
	}
	if (options?.cacheTags) {
		const tagsHeaderValue = CacheTags.toHeaderValue(options.cacheTags);
		if (tagsHeaderValue) {
			cacheHeaders['cache-tag'] = tagsHeaderValue;
		}
	}

	console.log(cacheHeaders);
	Object.entries(cacheHeaders).forEach(([key, value]) => {
		headers.append(key, value);
	});
}

class CacheTags {
	static forProduct(productId: string) {
		return `pid_${productId}`;
	}
	static forCollection(collectionId: string) {
		return `cid_${collectionId}`;
	}
	static forCollectionsMetadata() {
		return 'collections_metadata';
	}

	static toHeaderValue(options: CacheTagOptions): string | null {
		let arr: string[] = [];
		if (options.productIds) arr = arr.concat(options.productIds.map((id) => this.forProduct(id)));
		if (options.collectionIds)
			arr = arr.concat(options.collectionIds.map((id) => this.forCollection(id)));
		if (options.collectionsMetadata) arr.push(this.forCollectionsMetadata());

		return arr.length > 0 ? arr.join(',') : null;
	}
}
