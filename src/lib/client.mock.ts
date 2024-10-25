// This file contains mock functions for all storefront services.
// You can use this as a template to connect your own ecommerce provider.

import type { Options, RequestResult } from '@hey-api/client-fetch';
import type {
	Collection,
	CreateCustomerData,
	CreateCustomerError,
	CreateCustomerResponse,
	CreateOrderData,
	CreateOrderError,
	CreateOrderResponse,
	GetCollectionByIdData,
	GetCollectionByIdError,
	GetCollectionByIdResponse,
	GetCollectionsData,
	GetCollectionsError,
	GetCollectionsResponse,
	GetOrderByIdData,
	GetOrderByIdError,
	GetOrderByIdResponse,
	GetProductByIdData,
	GetProductByIdError,
	GetProductByIdResponse,
	GetProductsData,
	GetProductsError,
	GetProductsResponse,
	Order,
	Product,
} from './client.types.ts';
import { db, ProductsTable, isNull, eq, and, like, desc, asc, inArray } from 'astro:db';

import collectionsData from '../../data/collections.json';
import { productIdFromVariantId } from './util.ts';

export * from './client.types.ts';

const collections: Record<string, Collection> = collectionsData;

type DbProduct = typeof ProductsTable.$inferSelect;

type getProductsReturnType = RequestResult<GetProductsResponse, GetProductsError, false>;

export const getProducts = async <ThrowOnError extends boolean = false>(
	options?: Options<GetProductsData, ThrowOnError>,
): getProductsReturnType => {
	// Base filter - non-deleted products
	const baseFilter = isNull(ProductsTable.deletedAt);
	let filter = baseFilter;

	// Add optional filter clauses
	if (options?.query?.collectionId) {
		const condition = like(ProductsTable.collectionIds, `%"${options.query.collectionId}"%`);
		filter = and(filter, condition)!;
	}
	if (options?.query?.ids) {
		const ids = Array.isArray(options.query.ids) ? options.query.ids : [options.query.ids];
		const condition = inArray(ProductsTable.id, ids);
		filter = and(filter, condition)!;
	}

	if (filter === baseFilter)
		console.warn('getProducts called without any filters - not great for performance.');

	// Build filtered query, but allow further refinement to the builder
	let query = db.select().from(ProductsTable).where(filter).$dynamic();

	if (options?.query?.limit) query = query.limit(options.query.limit);

	// Optional ordering
	if (options?.query?.sort && options?.query?.order) {
		const colName = options.query.sort;
		let sortColumn =
			colName === 'name'
				? ProductsTable.name
				: colName === 'price'
					? ProductsTable.price
					: ProductsTable.updatedAt;
		query = query.orderBy(options.query.order === 'asc' ? asc(sortColumn) : desc(sortColumn));
	}

	const dbItems: DbProduct[] = await query;
	const items = mapDbProducts(dbItems);
	console.log('Fetched product count:', items.length);

	const result = asResult({ items, next: null });
	return result;
};

type getProductByIdReturnType = RequestResult<GetProductByIdResponse, GetProductByIdError, false>;

export const getProductById = async <ThrowOnError extends boolean = false>(
	options: Options<GetProductByIdData, ThrowOnError>,
): getProductByIdReturnType => {
	const items: DbProduct[] = await db
		.select()
		.from(ProductsTable)
		.where(eq(ProductsTable.id, options.path.id))
		.limit(1);
	if (items.length === 0) {
		const error = asError<GetProductByIdError>({ error: 'not-found' });
		if (options.throwOnError) throw error;
		return error as RequestResult<GetProductByIdResponse, GetProductByIdError, false>;
	}
	const product = mapDbProducts(items)[0]!;
	return asResult(product);
};

export const getCollections = <ThrowOnError extends boolean = false>(
	_options?: Options<GetCollectionsData, ThrowOnError>,
): RequestResult<GetCollectionsResponse, GetCollectionsError, ThrowOnError> => {
	return asResult({ items: Object.values(collections), next: null });
};

export const getCollectionById = <ThrowOnError extends boolean = false>(
	options: Options<GetCollectionByIdData, ThrowOnError>,
): RequestResult<GetCollectionByIdResponse, GetCollectionByIdError, ThrowOnError> => {
	const collection = collections[options.path.id];
	if (!collection) {
		const error = asError<GetCollectionByIdError>({ error: 'not-found' });
		if (options.throwOnError) throw error;
		return error as RequestResult<GetCollectionByIdResponse, GetCollectionByIdError, ThrowOnError>;
	}
	return asResult({ ...collection, products: [] });
};

export const createCustomer = <ThrowOnError extends boolean = false>(
	options?: Options<CreateCustomerData, ThrowOnError>,
): RequestResult<CreateCustomerResponse, CreateCustomerError, ThrowOnError> => {
	if (!options?.body) throw new Error('No body provided');
	return asResult({
		...options.body,
		id: options.body.id ?? 'customer-1',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		deletedAt: null,
	});
};

const orders: Record<string, Order> = {};

type createOrderReturnType = RequestResult<CreateOrderResponse, CreateOrderError, false>;

export const createOrder = async <ThrowOnError extends boolean = false>(
	options?: Options<CreateOrderData, ThrowOnError>,
): createOrderReturnType => {
	if (!options?.body) throw new Error('No body provided');

	const productIds = options.body.lineItems.map((item) =>
		productIdFromVariantId(item.productVariantId),
	);
	const productsResponse = await getProducts({
		query: { ids: productIds },
	});
	const products = productsResponse.data?.items;
	if (!products) {
		throw new Error('Failed to fetch products', { cause: productsResponse.error });
	}

	const order: Order = {
		...options.body,
		id: 'dk3fd0sak3d',
		number: 1001,
		lineItems: options.body.lineItems.map((lineItem) => ({
			...lineItem,
			id: crypto.randomUUID(),
			productVariant: getProductVariantFromLineItemInput(lineItem.productVariantId, products),
		})),
		billingAddress: getAddress(options.body.billingAddress),
		shippingAddress: getAddress(options.body.shippingAddress),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		deletedAt: null,
	};
	orders[order.id] = order;
	return asResult(order);
};

export const getOrderById = <ThrowOnError extends boolean = false>(
	options: Options<GetOrderByIdData, ThrowOnError>,
): RequestResult<GetOrderByIdResponse, GetOrderByIdError, ThrowOnError> => {
	const order = orders[options.path.id];
	if (!order) {
		const error = asError<GetOrderByIdError>({ error: 'not-found' });
		if (options.throwOnError) throw error;
		return error as RequestResult<GetOrderByIdResponse, GetOrderByIdError, ThrowOnError>;
	}
	return asResult(order);
};

function asResult<T>(data: T) {
	return Promise.resolve({
		data,
		error: undefined,
		request: new Request('https://example.com'),
		response: new Response(),
	});
}

function asError<T>(error: T) {
	return Promise.resolve({
		data: undefined,
		error,
		request: new Request('https://example.com'),
		response: new Response(),
	});
}

function getAddress(address: Required<CreateOrderData>['body']['shippingAddress']) {
	return {
		line1: address?.line1 ?? '',
		line2: address?.line2 ?? '',
		city: address?.city ?? '',
		country: address?.country ?? '',
		province: address?.province ?? '',
		postal: address?.postal ?? '',
		phone: address?.phone ?? null,
		company: address?.company ?? null,
		firstName: address?.firstName ?? null,
		lastName: address?.lastName ?? null,
	};
}

function getProductVariantFromLineItemInput(
	variantId: string,
	products: Product[],
): NonNullable<Order['lineItems']>[number]['productVariant'] {
	for (const product of products) {
		for (const variant of product.variants) {
			if (variant.id === variantId) {
				return { ...variant, product };
			}
		}
	}
	throw new Error(`Product variant ${variantId} not found`);
}

const apparelSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function makeVariants(product: DbProduct) {
	const apparelVariants = apparelSizes.map((size, index) => ({
		id: `${product.id}|${size}`,
		name: size,
		stock: index * 10,
		options: {
			Size: size,
		},
	}));
	return apparelVariants;
}

function mapDbProducts(productsFromSelect: DbProduct[]): Product[] {
	const result: Product[] = productsFromSelect.map((item) => {
		return {
			...item,
			collectionIds: item.collectionIds as string[],
			variants: makeVariants(item),
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			deletedAt: null,
			images: [],
		};
	});
	return result;
}
