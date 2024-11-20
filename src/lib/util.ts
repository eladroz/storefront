/** Returns the given value if it is non-nullish, otherwise throws an error. */
export function unwrap<T>(value: T, message?: string): NonNullable<T> {
	if (value == null) {
		const error = new Error(
			message || `Expected a non-null value, but got: ${safeStringify(value)}`,
		);
		Error.captureStackTrace(error, unwrap);
		throw error;
	}
	return value;
}

/** Attempts to stringify a value, but falls back to a string representation if it fails. */
function safeStringify(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

export function clamp(num: number, lower: number, upper: number) {
	return Math.max(lower, Math.min(num, upper));
}

export function inplaceShuffle(arr: any[]) {
	return arr.sort(() => Math.random() - Math.random());
}

export function productIdFromVariantId(productVariantId: string): string {
	const idElements = productVariantId.split('|');
	if (idElements.length !== 2) throw new Error(`Invalid productVariantId: ${productVariantId}`);
	return idElements[0]!;
}

export function getPaginationLinks(
	originalParams: URLSearchParams,
	options: {
		paramName: string;
		currentPage: number;
		totalPages: number;
	},
) {
	function modifiedParams(value: number) {
		const params = new URLSearchParams(originalParams.toString());
		params.set(options.paramName, value.toString());
		return '?' + params.toString();
	}

	return {
		prev:
			options.totalPages > 1 && options.currentPage > 1
				? modifiedParams(options.currentPage - 1)
				: null,
		next:
			options.totalPages > 1 && options.currentPage < options.totalPages
				? modifiedParams(options.currentPage + 1)
				: null,
	};
}

export function simpleDateNow() {
	return new Date()
		.toISOString()
		.replace('T', ' ')
		.replace(/\.\d+Z/, ' UTC');
}
