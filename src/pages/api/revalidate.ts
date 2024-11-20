import type { APIRoute, APIContext } from 'astro';
import { REVALIDATE_JOB } from '~/config.ts';
import { verifyAPICall } from '~/features/cart/auth.server.ts';
import { getJobStatus } from '~/lib/jobs/index.ts';
import { revalidateJob } from '~/lib/jobs/revalidate.ts';

export const GET: APIRoute = async (context: APIContext) => {
	if (!verifyAPICall(context)) return new Response('Not authorized', { status: 403 });

	const lastJobStatus = await getJobStatus(REVALIDATE_JOB);
	return Response.json(lastJobStatus);
};

export const POST: APIRoute = async (context: APIContext) => {
	if (!verifyAPICall(context)) return new Response('Not authorized', { status: 403 });

	return await revalidateJob({ trigger: 'api' });
};
