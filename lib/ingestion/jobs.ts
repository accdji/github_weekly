import { prisma } from "@/lib/db";
import { CACHE_WINDOWS } from "@/lib/http-cache";
import { memoizeWithTTL } from "@/lib/runtime-cache";

type JobStatus = "running" | "success" | "failed";

export async function createIngestionJob(input: {
  jobType: string;
  triggeredBy?: string;
  scope?: string;
}) {
  return prisma.ingestionJob.create({
    data: {
      jobType: input.jobType,
      triggeredBy: input.triggeredBy ?? "system",
      scope: input.scope ?? null,
      status: "running",
    },
  });
}

export async function finishIngestionJob(
  id: number,
  input: {
    status: JobStatus;
    cursor?: string | null;
    errorMessage?: string;
    stats?: Record<string, unknown>;
  },
) {
  return prisma.ingestionJob.update({
    where: { id },
    data: {
      status: input.status,
      cursor: input.cursor ?? null,
      errorMessage: input.errorMessage ?? null,
      statsJson: JSON.stringify(input.stats ?? {}),
      finishedAt: new Date(),
    },
  });
}

export async function createIngestionTask(input: {
  jobId: number;
  taskType: string;
}) {
  return prisma.ingestionTask.create({
    data: {
      jobId: input.jobId,
      taskType: input.taskType,
      status: "running",
    },
  });
}

export async function finishIngestionTask(
  id: number,
  input: {
    status: JobStatus;
    cursor?: string | null;
    itemCount?: number;
    errorMessage?: string;
    stats?: Record<string, unknown>;
  },
) {
  return prisma.ingestionTask.update({
    where: { id },
    data: {
      status: input.status,
      cursor: input.cursor ?? null,
      itemCount: input.itemCount ?? 0,
      errorMessage: input.errorMessage ?? null,
      statsJson: JSON.stringify(input.stats ?? {}),
      finishedAt: new Date(),
    },
  });
}

export async function createIngestionBatch(input: {
  jobId: number;
  taskId?: number;
  source?: string;
  resourceType: string;
  resourceWindowStart?: Date | null;
  resourceWindowEnd?: Date | null;
}) {
  return prisma.ingestionBatch.create({
    data: {
      jobId: input.jobId,
      taskId: input.taskId ?? null,
      source: input.source ?? "github",
      resourceType: input.resourceType,
      resourceWindowStart: input.resourceWindowStart ?? null,
      resourceWindowEnd: input.resourceWindowEnd ?? null,
      status: "running",
    },
  });
}

export async function finishIngestionBatch(
  id: number,
  input: {
    status: JobStatus;
    cursor?: string | null;
    itemCount?: number;
    errorMessage?: string;
    stats?: Record<string, unknown>;
  },
) {
  return prisma.ingestionBatch.update({
    where: { id },
    data: {
      status: input.status,
      cursor: input.cursor ?? null,
      itemCount: input.itemCount ?? 0,
      errorMessage: input.errorMessage ?? null,
      statsJson: JSON.stringify(input.stats ?? {}),
      completedAt: new Date(),
    },
  });
}

export async function listRecentIngestionJobs(limit = 20) {
  return getCachedRecentIngestionJobs(limit);
}

const getCachedRecentIngestionJobs = memoizeWithTTL(
  "recent-ingestion-jobs",
  CACHE_WINDOWS.jobs,
  async (limit: number) =>
    prisma.ingestionJob.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        tasks: {
          orderBy: { startedAt: "asc" },
        },
      },
    }),
);
