import { discoverRepositories } from "@/lib/ingestion/repositories";

export async function collectDailySnapshots() {
  const result = await discoverRepositories({
    triggeredBy: process.env.JOB_TRIGGERED_BY ?? "collector",
    syncStarHistory: true,
  });

  return {
    count: result.count,
    fetchedAt: result.fetchedAt,
    ingestionJobId: result.jobId,
    ingestionBatchId: result.batchId,
  };
}
