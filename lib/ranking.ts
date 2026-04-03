import { prisma } from "@/lib/db";
import { daysAgo, getWeekKey } from "@/lib/time";
import { hasCoveredStarHistory, sumStarDailyRange } from "@/lib/star-history";

export type RankingRow = {
  repositoryId: number;
  score: number;
  starDelta7d: number;
  forkDelta7d: number;
  snapshotAt: Date;
};

export async function buildWeeklyRanking(targetDate = new Date()) {
  const compareDate = daysAgo(targetDate, 7);
  const snapshots = await prisma.snapshot.findMany({
    orderBy: { fetchedAt: "desc" },
    include: { repository: true },
  });
  const starStats = await prisma.starDailyStat.findMany({
    where: {
      date: {
        gte: compareDate,
        lte: targetDate,
      },
    },
    orderBy: [{ repositoryId: "asc" }, { date: "asc" }],
  });
  const starGrouped = new Map<number, typeof starStats>();

  for (const stat of starStats) {
    const entry = starGrouped.get(stat.repositoryId) ?? [];
    entry.push(stat);
    starGrouped.set(stat.repositoryId, entry);
  }

  const currentSnapshots = snapshots.filter(
    (snapshot, index, items) => items.findIndex((candidate) => candidate.repositoryId === snapshot.repositoryId) === index,
  );
  const rows: RankingRow[] = [];

  for (const snapshot of currentSnapshots) {
    const previousSnapshot = await prisma.snapshot.findFirst({
      where: {
        repositoryId: snapshot.repositoryId,
        fetchedAt: { lte: compareDate },
      },
      orderBy: { fetchedAt: "desc" },
    });

    const historyReady = hasCoveredStarHistory(snapshot.repository.starHistoryFrom, compareDate);
    const starDelta7d = historyReady
      ? sumStarDailyRange(starGrouped.get(snapshot.repositoryId) ?? [], compareDate, targetDate)
      : snapshot.stars - (previousSnapshot?.stars ?? snapshot.stars);
    const forkDelta7d = snapshot.forks - (previousSnapshot?.forks ?? snapshot.forks);
    const pushedAt = snapshot.repository.pushedAtGh?.getTime() ?? snapshot.fetchedAt.getTime();
    const recencyDays = Math.max(0, (targetDate.getTime() - pushedAt) / 86400000);
    const recencyBonus = Math.max(0, 10 - recencyDays);
    const score = starDelta7d * 1 + forkDelta7d * 0.35 + recencyBonus * 0.2;

    rows.push({
      repositoryId: snapshot.repositoryId,
      score,
      starDelta7d,
      forkDelta7d,
      snapshotAt: snapshot.fetchedAt,
    });
  }

  rows.sort((left, right) => right.score - left.score || right.starDelta7d - left.starDelta7d);

  const weekKey = getWeekKey(targetDate);

  await prisma.$transaction([
    prisma.weeklyRanking.deleteMany({ where: { weekKey } }),
    prisma.weeklyRanking.createMany({
      data: rows.map((row, index) => ({
        weekKey,
        repositoryId: row.repositoryId,
        rank: index + 1,
        score: row.score,
        starDelta7d: row.starDelta7d,
        forkDelta7d: row.forkDelta7d,
        snapshotAt: row.snapshotAt,
      })),
    }),
  ]);

  return { weekKey, count: rows.length };
}
