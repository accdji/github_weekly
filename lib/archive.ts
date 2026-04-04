import { prisma } from "@/lib/db";
import { CACHE_WINDOWS } from "@/lib/http-cache";
import { memoizeWithTTL } from "@/lib/runtime-cache";

export async function getWeeklyArchive() {
  return getCachedWeeklyArchive();
}

export async function getRepositoryTrend(fullName: string) {
  return getCachedRepositoryTrend(fullName);
}

const getCachedWeeklyArchive = memoizeWithTTL(
  "weekly-archive",
  CACHE_WINDOWS.archive,
  async () => {
    const rows = await prisma.weeklyRanking.findMany({
      include: { repository: true },
      orderBy: [{ weekKey: "desc" }, { rank: "asc" }],
    });
    const grouped = new Map<string, typeof rows>();

    for (const row of rows) {
      const list = grouped.get(row.weekKey) ?? [];
      list.push(row);
      grouped.set(row.weekKey, list);
    }

    return Array.from(grouped.entries()).map(([weekKey, items]) => ({
      weekKey,
      top: items.slice(0, 10).map((item) => ({
        rank: item.rank,
        fullName: item.repository.fullName,
        htmlUrl: item.repository.htmlUrl,
        starDelta7d: item.starDelta7d,
        score: item.score,
      })),
    }));
  },
);

const getCachedRepositoryTrend = memoizeWithTTL(
  "repository-trend",
  CACHE_WINDOWS.repository,
  async (fullName: string) => {
    const repository = await prisma.repository.findUnique({
      where: { fullName },
      include: {
        snapshots: { orderBy: { fetchedAt: "asc" }, take: 180 },
        starDailyStats: { orderBy: { date: "asc" }, take: 180 },
        rankings: { orderBy: [{ weekKey: "desc" }, { rank: "asc" }], take: 26 },
      },
    });

    if (!repository) {
      return null;
    }

    return {
      fullName: repository.fullName,
      description: repository.description,
      htmlUrl: repository.htmlUrl,
      language: repository.language,
      stars: repository.stars,
      forks: repository.forks,
      snapshots: repository.snapshots.map((item) => ({
        fetchedAt: item.fetchedAt.toISOString(),
        stars: item.stars,
        forks: item.forks,
      })),
      starDailyStats: repository.starDailyStats.map((item) => ({
        date: item.date.toISOString().slice(0, 10),
        starsAdded: item.starsAdded,
      })),
      rankings: repository.rankings.map((item) => ({
        weekKey: item.weekKey,
        rank: item.rank,
        starDelta7d: item.starDelta7d,
        score: item.score,
      })),
    };
  },
);
