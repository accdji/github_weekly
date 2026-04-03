import { prisma } from "@/lib/db";
import { fetchRecentStarredAtDates, hasGitHubToken } from "@/lib/github";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getStarHistoryStart(days = Number(process.env.GITHUB_STAR_HISTORY_DAYS ?? "35")) {
  const now = new Date();
  return startOfUtcDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days)));
}

export function hasCoveredStarHistory(historyFrom: Date | null, requiredFrom: Date) {
  return Boolean(historyFrom && startOfUtcDay(historyFrom) <= startOfUtcDay(requiredFrom));
}

export async function syncRepositoryStarHistory(repository: {
  id: number;
  owner: string;
  name: string;
}) {
  if (!hasGitHubToken()) {
    return {
      synced: false,
      reason: "missing-token" as const,
    };
  }

  const since = getStarHistoryStart();
  const now = new Date();
  const starredAtDates = await fetchRecentStarredAtDates(repository.owner, repository.name, since);
  const counts = new Map<string, number>();

  for (const value of starredAtDates) {
    const key = value.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const rows = Array.from(counts.entries()).map(([date, starsAdded]) => ({
    repositoryId: repository.id,
    date: new Date(`${date}T00:00:00.000Z`),
    starsAdded,
    collectedAt: now,
  }));

  await prisma.$transaction([
    prisma.starDailyStat.deleteMany({
      where: {
        repositoryId: repository.id,
        date: {
          gte: since,
        },
      },
    }),
    prisma.starDailyStat.createMany({
      data: rows,
    }),
    prisma.repository.update({
      where: {
        id: repository.id,
      },
      data: {
        starHistoryFrom: since,
        starHistorySyncedAt: now,
      },
    }),
  ]);

  return {
    synced: true,
    days: rows.length,
  };
}

export function sumStarDailyRange(
  stats: Array<{
    date: Date;
    starsAdded: number;
  }>,
  from: Date,
  to: Date,
) {
  const normalizedFrom = startOfUtcDay(from).getTime();
  const normalizedTo = startOfUtcDay(to).getTime();

  return stats.reduce((sum, item) => {
    const day = startOfUtcDay(item.date).getTime();
    return day >= normalizedFrom && day <= normalizedTo ? sum + item.starsAdded : sum;
  }, 0);
}
