import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";
import { listRecentJobRuns } from "@/lib/jobs";

export const revalidate = 30;

export async function GET() {
  const items = await listRecentJobRuns();

  return jsonWithCache({
    items: items.map((item) => ({
      id: item.id,
      jobType: item.jobType,
      status: item.status,
      triggeredBy: item.triggeredBy,
      message: item.message,
      stats: JSON.parse(item.statsJson),
      startedAt: item.startedAt.toISOString(),
      finishedAt: item.finishedAt?.toISOString() ?? null,
    })),
  }, CACHE_WINDOWS.jobs);
}
