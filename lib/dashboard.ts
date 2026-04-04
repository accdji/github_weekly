import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DashboardItem, DashboardPayload, DashboardRange, HeatmapCell } from "@/lib/dashboard-types";
import { CACHE_WINDOWS } from "@/lib/http-cache";
import { memoizeWithTTL } from "@/lib/runtime-cache";
import { hasCoveredStarHistory, sumStarDailyRange } from "@/lib/star-history";

type SnapshotWithRepository = Prisma.SnapshotGetPayload<{
  include: {
    repository: true;
  };
}>;

function parseTopics(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toStartOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getWeekBounds(weekKey: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - day + 1);
  const sunday = addDays(monday, 6);

  return {
    from: toStartOfDay(monday),
    to: new Date(Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59, 999)),
  };
}

function getRangeDates(range: DashboardRange, now: Date, weekKey?: string | null, from?: string | null, to?: string | null) {
  if (range === "snapshot" && weekKey) {
    const bounds = getWeekBounds(weekKey);
    if (bounds) {
      return {
        from: bounds.from,
        to: bounds.to,
        label: weekKey,
      };
    }
  }

  if (range === "custom" && from && to) {
    return {
      from: new Date(from),
      to: new Date(to),
      label: "Custom",
    };
  }

  if (range === "today") {
    return {
      from: toStartOfDay(now),
      to: now,
      label: "Today",
    };
  }

  if (range === "month") {
    return {
      from: addDays(toStartOfDay(now), -30),
      to: now,
      label: "30 Days",
    };
  }

  return {
    from: addDays(toStartOfDay(now), -7),
    to: now,
    label: "7 Days",
  };
}

function findLastAtOrBefore(snapshots: SnapshotWithRepository[], cutoff: Date) {
  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    if (snapshots[index].fetchedAt <= cutoff) {
      return snapshots[index];
    }
  }

  return null;
}

function getEarliestSnapshot(snapshots: SnapshotWithRepository[]) {
  return snapshots[0] ?? null;
}

function getCoverageDays(current: Date, baseline: Date | null) {
  if (!baseline) {
    return 0;
  }

  return Math.max(0, Math.floor((current.getTime() - baseline.getTime()) / 86400000));
}

function hasAnyComparableHistory(historyFrom: Date | null, delta: { coverageDays: number; hasBaseline: boolean }) {
  return Boolean(historyFrom) || delta.hasBaseline || delta.coverageDays > 0;
}

function resolveDelta(snapshots: SnapshotWithRepository[], current: SnapshotWithRepository, cutoff: Date, requiredDays: number) {
  const exactBaseline = findLastAtOrBefore(snapshots, cutoff);

  if (exactBaseline && exactBaseline.id !== current.id) {
    return {
      value: current.stars - exactBaseline.stars,
      ready: true,
      hasBaseline: true,
      coverageDays: getCoverageDays(current.fetchedAt, exactBaseline.fetchedAt),
    };
  }

  const earliest = getEarliestSnapshot(snapshots);

  if (earliest && earliest.id !== current.id) {
    return {
      value: current.stars - earliest.stars,
      ready: getCoverageDays(current.fetchedAt, earliest.fetchedAt) >= requiredDays,
      hasBaseline: true,
      coverageDays: getCoverageDays(current.fetchedAt, earliest.fetchedAt),
    };
  }

  return {
    value: 0,
    ready: false,
    hasBaseline: false,
    coverageDays: 0,
  };
}

function minDate(...dates: Date[]) {
  return new Date(Math.min(...dates.map((date) => date.getTime())));
}

function buildHeatmap(groups: Map<number, SnapshotWithRepository[]>, endDate: Date): HeatmapCell[] {
  const startDate = addDays(toStartOfDay(endDate), -27);
  const buckets = new Map<string, number>();

  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    buckets.set(cursor.toISOString().slice(0, 10), 0);
  }

  for (const snapshots of groups.values()) {
    for (let index = 1; index < snapshots.length; index += 1) {
      const current = snapshots[index];
      const previous = snapshots[index - 1];
      const key = current.fetchedAt.toISOString().slice(0, 10);

      if (!buckets.has(key)) {
        continue;
      }

      buckets.set(key, (buckets.get(key) ?? 0) + Math.max(0, current.stars - previous.stars));
    }
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}

function computeHealthScore(stars: number, openIssues: number, lastPushedAt: Date | null) {
  const freshnessDays = lastPushedAt ? Math.max(0, (Date.now() - lastPushedAt.getTime()) / 86400000) : 365;
  const freshnessScore = Math.max(0, 30 - freshnessDays) * 1.4;
  const scaleScore = Math.min(30, Math.log10(Math.max(stars, 10)) * 10);
  const issuePenalty = Math.min(25, openIssues * 0.15);
  return Math.max(0, Math.min(100, freshnessScore + scaleScore - issuePenalty));
}

function buildHotReason(input: {
  language: string | null;
  topics: string[];
  weeklyStars: number;
  forks: number;
  pushedAt: Date | null;
}) {
  const topicText = input.topics.join(" ").toLowerCase();
  const freshnessDays = input.pushedAt ? Math.max(0, (Date.now() - input.pushedAt.getTime()) / 86400000) : 99;

  if (topicText.includes("ai") || topicText.includes("llm") || topicText.includes("agent")) {
    return "AI-related momentum plus strong recent star growth.";
  }

  if (freshnessDays <= 3 && input.weeklyStars > 0) {
    return "Recently pushed code and visible weekly star acceleration.";
  }

  if ((input.language === "TypeScript" || input.language === "JavaScript") && input.forks > 500) {
    return "Large developer adoption signal with strong ecosystem pull.";
  }

  return "Steady open-source growth supported by stars, forks, and recent activity.";
}

async function fetchDashboardData(options?: {
  range?: DashboardRange;
  weekKey?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const now = new Date();
  const range = options?.range ?? "week";
  const dates = getRangeDates(range, now, options?.weekKey, options?.from, options?.to);
  const todayStart = toStartOfDay(dates.to);
  const starStatsFrom = minDate(dates.from, addDays(dates.to, -30), addDays(dates.to, -7), addDays(dates.to, -1));
  const snapshots = await prisma.snapshot.findMany({
    orderBy: [{ repositoryId: "asc" }, { fetchedAt: "asc" }],
    include: { repository: true },
  });
  const starStats = await prisma.starDailyStat.findMany({
    where: {
      date: {
        gte: starStatsFrom,
        lte: dates.to,
      },
    },
    orderBy: [{ repositoryId: "asc" }, { date: "asc" }],
  });
  const availableWeeks = (
    await prisma.weeklyRanking.findMany({
      distinct: ["weekKey"],
      orderBy: { weekKey: "desc" },
      select: { weekKey: true },
    })
  ).map((item) => item.weekKey);

  const grouped = new Map<number, SnapshotWithRepository[]>();
  const starGrouped = new Map<number, typeof starStats>();

  for (const snapshot of snapshots) {
    const entry = grouped.get(snapshot.repositoryId) ?? [];
    entry.push(snapshot);
    grouped.set(snapshot.repositoryId, entry);
  }

  for (const stat of starStats) {
    const entry = starGrouped.get(stat.repositoryId) ?? [];
    entry.push(stat);
    starGrouped.set(stat.repositoryId, entry);
  }

  const items: DashboardItem[] = [];

  for (const repositorySnapshots of grouped.values()) {
    const current = findLastAtOrBefore(repositorySnapshots, dates.to) ?? repositorySnapshots[repositorySnapshots.length - 1];

    if (!current) {
      continue;
    }

    const rangeDelta = resolveDelta(repositorySnapshots, current, dates.from, Math.max(1, getCoverageDays(dates.to, dates.from)));
    const todayDelta = resolveDelta(repositorySnapshots, current, todayStart, 1);
    const monthDelta = resolveDelta(repositorySnapshots, current, addDays(dates.to, -30), 30);
    const weekDelta = resolveDelta(repositorySnapshots, current, addDays(dates.to, -7), 7);
    const topics = parseTopics(current.repository.topicsJson);
    const healthScore = computeHealthScore(current.stars, current.openIssues, current.repository.pushedAtGh);
    const repositoryStarStats = starGrouped.get(current.repositoryId) ?? [];
    const hasRangeHistory = hasCoveredStarHistory(current.repository.starHistoryFrom, dates.from);
    const hasWeekHistory = hasCoveredStarHistory(current.repository.starHistoryFrom, addDays(dates.to, -7));
    const hasTodayHistory = hasCoveredStarHistory(current.repository.starHistoryFrom, todayStart);
    const rangeStars = hasRangeHistory ? sumStarDailyRange(repositoryStarStats, dates.from, dates.to) : rangeDelta.value;
    const weeklyStars = hasWeekHistory ? sumStarDailyRange(repositoryStarStats, addDays(dates.to, -7), dates.to) : weekDelta.value;
    const todayStars = hasTodayHistory ? sumStarDailyRange(repositoryStarStats, todayStart, dates.to) : todayDelta.value;
    const monthlyStars = hasCoveredStarHistory(current.repository.starHistoryFrom, addDays(dates.to, -30))
      ? sumStarDailyRange(repositoryStarStats, addDays(dates.to, -30), dates.to)
      : monthDelta.value;
    const hasRangeComparableHistory = hasAnyComparableHistory(current.repository.starHistoryFrom, rangeDelta);
    const hasWeekComparableHistory = hasAnyComparableHistory(current.repository.starHistoryFrom, weekDelta);
    const hasTodayComparableHistory = hasAnyComparableHistory(current.repository.starHistoryFrom, todayDelta);

    items.push({
      repositoryId: current.repositoryId,
      fullName: current.repository.fullName,
      owner: current.repository.owner,
      name: current.repository.name,
      description: current.repository.description,
      htmlUrl: current.repository.htmlUrl,
      cloneUrl: `${current.repository.htmlUrl}.git`,
      language: current.repository.language,
      topics,
      stars: current.stars,
      forks: current.forks,
      weeklyStars,
      todayStars,
      monthlyStars,
      rangeStars,
      rangeLabel: dates.label,
      score: Number((rangeStars + current.forks * 0.03).toFixed(2)),
      hotReason: buildHotReason({
        language: current.repository.language,
        topics,
        weeklyStars,
        forks: current.forks,
        pushedAt: current.repository.pushedAtGh,
      }),
      healthScore: Number(healthScore.toFixed(1)),
      issuePressure: current.openIssues,
      lastPushedAt: current.repository.pushedAtGh?.toISOString() ?? null,
      lastCollectedAt: current.fetchedAt.toISOString(),
      weeklyHistoryReady: hasWeekHistory || weekDelta.ready || hasWeekComparableHistory,
      weeklyHistoryComplete: hasWeekHistory || weekDelta.ready,
      todayHistoryReady: hasTodayHistory || todayDelta.ready || hasTodayComparableHistory,
      rangeHistoryReady: hasRangeHistory || rangeDelta.ready || hasRangeComparableHistory,
      rangeHistoryComplete: hasRangeHistory || rangeDelta.ready,
      historyCoverageDays: hasWeekHistory && current.repository.starHistoryFrom
        ? getCoverageDays(current.fetchedAt, current.repository.starHistoryFrom)
        : hasWeekComparableHistory
          ? Math.max(1, weekDelta.coverageDays)
          : weekDelta.coverageDays,
    });
  }

  items.sort((left, right) => right.rangeStars - left.rangeStars || right.weeklyStars - left.weeklyStars || right.stars - left.stars);

  const languageTotals = new Map<string, number>();

  for (const item of items) {
    const key = item.language ?? "Unknown";
    languageTotals.set(key, (languageTotals.get(key) ?? 0) + item.rangeStars);
  }

  const topLanguage = Array.from(languageTotals.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Unknown";
  const freshestProject = [...items]
    .sort((left, right) => (right.lastPushedAt ?? "").localeCompare(left.lastPushedAt ?? ""))[0]
    ?.fullName ?? null;

  const payload: DashboardPayload = {
    generatedAt: new Date().toISOString(),
    lastFetchedAt: items[0]?.lastCollectedAt ?? null,
    range,
    rangeLabel: dates.label,
    from: dates.from.toISOString(),
    to: dates.to.toISOString(),
    weekKey: options?.weekKey ?? null,
    availableWeeks,
    availableLanguages: Array.from(new Set(items.map((item) => item.language).filter((item): item is string => Boolean(item)))).sort(),
    items,
    summary: {
      totalProjects: items.length,
      totalStars: items.reduce((sum, item) => sum + item.stars, 0),
      totalForks: items.reduce((sum, item) => sum + item.forks, 0),
      totalRangeStars: items.reduce((sum, item) => sum + item.rangeStars, 0),
      totalWeeklyStars: items.reduce((sum, item) => sum + item.weeklyStars, 0),
      topLanguage,
      freshestProject,
      weeklyCoverageDays: Math.min(
        7,
        items.reduce((max, item) => Math.max(max, item.historyCoverageDays), 0),
      ),
      weeklyCoverageComplete: items.some((item) => item.weeklyHistoryComplete),
    },
    heatmap: buildHeatmap(grouped, dates.to),
  };

  return payload;
}

function normalizeDashboardOptions(options?: {
  range?: DashboardRange;
  weekKey?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  return {
    range: options?.range ?? "week",
    weekKey: options?.weekKey ?? null,
    from: options?.from ?? null,
    to: options?.to ?? null,
  };
}

const getCachedDashboardData = memoizeWithTTL(
  "dashboard-data",
  CACHE_WINDOWS.dashboard,
  async (cacheKey: string) => {
    const options = JSON.parse(cacheKey) as {
      range?: DashboardRange;
      weekKey?: string | null;
      from?: string | null;
      to?: string | null;
    };

    return fetchDashboardData(options);
  },
);

export async function getDashboardData(options?: {
  range?: DashboardRange;
  weekKey?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  return getCachedDashboardData(JSON.stringify(normalizeDashboardOptions(options)));
}
