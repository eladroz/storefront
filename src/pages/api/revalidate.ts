import type { APIRoute } from 'astro';
import { revalidateJob } from '~/lib/jobs/revalidate.ts';

// TODO only run if secret token is passed, create wrapper function/class to reuse code
export const GET: APIRoute = async () => {
	return await revalidateJob();
};
