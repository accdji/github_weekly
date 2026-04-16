import { prisma } from "@/lib/db";
import { processPendingDeliveries, scheduleDigestDeliveries } from "@/lib/subscriptions";

export async function createWorkerRun(workerType: string, triggeredBy = "system") {
  return prisma.workerRun.create({
    data: {
      workerType,
      status: "running",
      triggeredBy,
    },
  });
}

export async function finishWorkerRun(
  id: number,
  status: "success" | "failed",
  message?: string,
  stats?: Record<string, unknown>,
) {
  return prisma.workerRun.update({
    where: { id },
    data: {
      status,
      message,
      statsJson: JSON.stringify(stats ?? {}),
      finishedAt: new Date(),
    },
  });
}

export async function listRecentWorkerRuns(limit = 30) {
  const items = await prisma.workerRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return items.map((item) => ({
    id: item.id,
    workerType: item.workerType,
    status: item.status,
    triggeredBy: item.triggeredBy,
    stats: JSON.parse(item.statsJson),
    message: item.message,
    startedAt: item.startedAt.toISOString(),
    finishedAt: item.finishedAt?.toISOString() ?? null,
  }));
}

export async function runSubscriptionWorker(input?: {
  triggeredBy?: string;
  frequency?: "weekly" | "monthly";
}) {
  const worker = await createWorkerRun("subscription-digests", input?.triggeredBy ?? "system");

  try {
    const scheduled = await scheduleDigestDeliveries({
      triggeredBy: input?.triggeredBy ?? "system",
      frequency: input?.frequency ?? "weekly",
    });
    const processed = await processPendingDeliveries();
    const stats = {
      scheduled,
      processed,
    };

    await finishWorkerRun(worker.id, "success", "Subscription worker completed.", stats);
    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    await finishWorkerRun(worker.id, "failed", message);
    throw error;
  }
}
