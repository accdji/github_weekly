import { prisma } from "@/lib/db";
import { CACHE_WINDOWS } from "@/lib/http-cache";
import { memoizeWithTTL } from "@/lib/runtime-cache";

export async function createJobRun(jobType: string, triggeredBy = "system") {
  return prisma.jobRun.create({
    data: {
      jobType,
      status: "running",
      triggeredBy,
    },
  });
}

export async function finishJobRun(
  id: number,
  status: "success" | "failed",
  message?: string,
  stats?: Record<string, unknown>,
) {
  return prisma.jobRun.update({
    where: { id },
    data: {
      status,
      message,
      statsJson: JSON.stringify(stats ?? {}),
      finishedAt: new Date(),
    },
  });
}

export async function listRecentJobRuns(limit = 30) {
  return getCachedRecentJobRuns(limit);
}

const getCachedRecentJobRuns = memoizeWithTTL(
  "recent-job-runs",
  CACHE_WINDOWS.jobs,
  async (limit: number) =>
    prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    }),
);
