import type { NextRequest } from "next/server";
import { getJob } from "@/lib/analysisQueue";
import { badRequest, notFound, ok, toIssues } from "@/lib/api";
import { JobIdParamSchema } from "@/types/schemas";

export async function GET(
	_req: NextRequest,
	{ params }: { params: { id: string } },
) {
	const parsed = JobIdParamSchema.safeParse(params);
	if (!parsed.success) {
		return badRequest("Invalid job id", toIssues(parsed.error));
	}
	const job = getJob(parsed.data.id);
	if (!job) return notFound("Job not found");
	return ok({
		id: job.id,
		status: job.status,
		createdAt: job.createdAt,
		updatedAt: job.updatedAt,
		total: job.total,
		completed: job.completed,
		results: job.results,
		error: job.error ?? null,
	});
}
