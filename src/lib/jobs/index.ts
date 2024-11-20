import { JobsTable, db, eq } from 'astro:db';

export type JobTrigger = 'api' | 'user' | 'scheduled';
type DbJobResult = {
	date: string;
	info: object;
	trigger?: JobTrigger;
};
type DbJob = typeof JobsTable.$inferSelect;
type JobResult = {
	date: Date;
	info: object;
	trigger?: JobTrigger;
};
type Job = {
	name: string;
	lastSuccess?: JobResult;
	lastFailure?: JobResult;
};

function mapDbJob(dbJob: DbJob): Job {
	const result: Job = { name: dbJob.name };
	if (dbJob.lastSuccess) {
		const dbValue = dbJob.lastSuccess as DbJobResult;
		result.lastSuccess = { ...dbValue, date: new Date(dbValue.date) };
	}
	if (dbJob.lastFailure) {
		const dbValue = dbJob.lastFailure as DbJobResult;
		result.lastFailure = { ...dbValue, date: new Date(dbValue.date) };
	}
	return result;
}

export async function getJobStatus(jobName: string) {
	const lastRunResponse: DbJob[] = await db
		.select()
		.from(JobsTable)
		.where(eq(JobsTable.name, jobName));

	if (lastRunResponse.length === 1) {
		return mapDbJob(lastRunResponse[0]!);
	} else {
		return null;
	}
}

export async function saveJobStatus(
	jobName: string,
	options: {
		error?: boolean;
		date: Date;
		info: object;
		isFirstRun?: boolean;
		trigger?: JobTrigger;
	},
) {
	const jobInfo: DbJobResult = {
		date: options.date.toISOString(),
		trigger: options.trigger,
		info: options.info,
	};

	const values: typeof JobsTable.$inferInsert = { name: jobName };
	values[options.error ? 'lastFailure' : 'lastSuccess'] = jobInfo;

	if (options.isFirstRun) {
		await db.insert(JobsTable).values(values);
	} else {
		await db.update(JobsTable).set(values).where(eq(JobsTable.name, jobName));
	}
}

export function makeResponse(options: { error?: boolean; message: string; data?: object }) {
	const o = {
		success: !options.error,
		message: options.message,
		...options.data,
	};
	console.log('Job response:', o);
	return new Response(JSON.stringify(o), { status: options.error ? 500 : 200 });
}
