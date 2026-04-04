import { prisma } from "@/lib/db";
import { discoverRepositories } from "@/lib/ingestion/repositories";
import { buildWeeklyRanking } from "@/lib/ranking";
import { createJobRun, finishJobRun } from "@/lib/jobs";
import { syncRepositoryStarHistory } from "@/lib/star-history";

async function syncAllRepositories() {
  const repositories = await prisma.repository.findMany({
    orderBy: { stars: "desc" },
  });

  let synced = 0;
  let skipped = 0;

  for (const repository of repositories) {
    const result = await syncRepositoryStarHistory({
      id: repository.id,
      owner: repository.owner,
      name: repository.name,
    });

    if (result.synced) {
      synced += 1;
    } else {
      skipped += 1;
      if (result.reason === "missing-token") {
        break;
      }
    }
  }

  return { synced, skipped };
}

async function main() {
  const syncAllStars = process.argv.includes("--sync-all-stars");
  const triggeredBy = process.env.JOB_TRIGGERED_BY ?? "cli";
  const job = await createJobRun("pipeline", triggeredBy);

  try {
    const collected = await discoverRepositories({ triggeredBy });
    const starHistory = syncAllStars ? await syncAllRepositories() : { synced: 0, skipped: 0 };
    const ranking = await buildWeeklyRanking();

    await finishJobRun(job.id, "success", "Pipeline completed successfully.", {
      ingestionJobId: collected.jobId,
      ingestionBatchId: collected.batchId,
      collectedRepositories: collected.count,
      fetchedAt: collected.fetchedAt.toISOString(),
      starHistory,
      ranking,
    });

    console.log(
      JSON.stringify(
        {
          status: "success",
          ingestionJobId: collected.jobId,
          ingestionBatchId: collected.batchId,
          collectedRepositories: collected.count,
          fetchedAt: collected.fetchedAt.toISOString(),
          starHistory,
          ranking,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error";
    await finishJobRun(job.id, "failed", message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
