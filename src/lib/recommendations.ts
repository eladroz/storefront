import { type Product, getProducts } from 'storefront:client';
import { getProductStock } from '~/lib/products.ts';
import { inplaceShuffle } from '~/lib/util.ts';

const defaultItemCount = 7;
const defaultSampleSize = 20;

export async function getRecommendedProducts(options?: {
	collectionId?: string;
	excludeIds?: string[];
	itemCount?: number;
	sampleSize?: number;
}): Promise<Product[]> {
	options = { itemCount: defaultItemCount, sampleSize: defaultSampleSize, ...options };

	const limit = options.sampleSize || options.itemCount || defaultSampleSize;
	const productsResponse = await getProducts({
		query: {
			limit,
			collectionId: options.collectionId,
		},
	});

	let products = productsResponse.data?.items ?? [];
	products = products.filter((p) => getProductStock(p) > 0);
	if (options.excludeIds?.length) {
		products = products.filter((p) => !options.excludeIds?.includes(p.id));
	}

	products = inplaceShuffle(products).slice(0, options.itemCount);
	return products;
}
