import type { APIRoute, APIContext } from 'astro';
import { verifySession } from '~/features/cart/auth.server.ts';
import { revalidateJob } from '~/lib/jobs/revalidate.ts';

export const GET: APIRoute = async (context: APIContext) => {
	if (!verifySession(context.cookies)) return new Response('Not authorized', { status: 403 });

	return await revalidateJob();
};
