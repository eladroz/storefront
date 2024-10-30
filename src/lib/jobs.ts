import { JobsTable, db, eq } from 'astro:db';

type DbJobResult = {
	date: string;
	info: object;
};
type DbJob = typeof JobsTable.$inferSelect;
type JobResult = {
	date: Date;
	info: object;
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
	},
) {
	const jobInfo: DbJobResult = {
		date: options.date.toISOString(),
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
