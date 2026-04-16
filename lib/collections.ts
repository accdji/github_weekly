import { prisma } from "@/lib/db";
import { collectionSeedDefinitions, matchesCollectionSeed } from "@/lib/collection-seed";
import { getDashboardData } from "@/lib/dashboard";
import { CACHE_WINDOWS } from "@/lib/http-cache";
import { memoizeWithTTL } from "@/lib/runtime-cache";
import type {
  CollectionDetailPayload,
  CollectionListItem,
  CollectionPreviewRepository,
  CollectionRelatedItem,
  CollectionTrendPoint,
  DashboardItem,
} from "@/lib/dashboard-types";

function startOfYear(year: number) {
  return new Date(Date.UTC(year, 0, 1));
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function groupItemsById(items: DashboardItem[]) {
  return new Map(items.map((item) => [item.repositoryId, item]));
}

function slugifyTag(value: string) {
  return value.toLowerCase().replaceAll(/\s+/g, "-");
}

function toPreviewRepository(item: DashboardItem): CollectionPreviewRepository {
  return {
    repositoryId: item.repositoryId,
    fullName: item.fullName,
    owner: item.owner,
    name: item.name,
    htmlUrl: item.htmlUrl,
    description: item.description,
    language: item.language,
    weeklyStars: item.weeklyStars,
    rangeStars: item.rangeStars,
    stars: item.stars,
    forks: item.forks,
    hotReason: item.hotReason,
  };
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function estimatePrsFromStars(starsAdded: number) {
  return starsAdded <= 0 ? 0 : Math.max(1, Math.round(starsAdded / 20));
}

function estimateIssuesFromStars(starsAdded: number) {
  return starsAdded <= 0 ? 0 : Math.max(1, Math.round(starsAdded / 14));
}

function estimateContributorsFromStars(starsAdded: number) {
  return starsAdded <= 0 ? 0 : Math.max(1, Math.round(Math.sqrt(starsAdded)));
}

function overlayTrendSnapshots(
  series: CollectionTrendPoint[],
  snapshots: Array<{
    date: Date;
    starsAdded: number;
    prsOpened: number;
    prsMerged: number;
    issuesOpened: number;
    issuesClosed: number;
    activeContributors: number;
  }>,
) {
  const pointByDate = new Map(series.map((point) => [point.date, point]));

  for (const snapshot of snapshots) {
    const key = snapshot.date.toISOString().slice(0, 10);
    const point = pointByDate.get(key);

    if (!point) {
      continue;
    }

    point.starsAdded = snapshot.starsAdded;
    point.prsOpened = snapshot.prsOpened;
    point.prsMerged = snapshot.prsMerged;
    point.issuesOpened = snapshot.issuesOpened;
    point.issuesClosed = snapshot.issuesClosed;
    point.activeContributors = snapshot.activeContributors;
  }

  return series;
}

function buildRelatedCollections(input: {
  currentSlug: string;
  currentTags: string[];
  collections: Array<{
    slug: string;
    name: string;
    featured: boolean;
    tags: Array<{ tag: { name: string } }>;
    _count: { items: number };
  }>;
}): CollectionRelatedItem[] {
  const currentTags = new Set(input.currentTags);

  return input.collections
    .map((collection) => {
      const tags = collection.tags.map((tagMap) => tagMap.tag.name);
      const overlap = tags.filter((tag) => currentTags.has(tag)).length;

      return {
        slug: collection.slug,
        name: collection.name,
        tags,
        repositoryCount: collection._count.items,
        overlap,
        featured: collection.featured,
      };
    })
    .filter((collection) => collection.slug !== input.currentSlug && collection.overlap > 0)
    .sort(
      (left, right) =>
        right.overlap - left.overlap ||
        Number(right.featured) - Number(left.featured) ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 3)
    .map(({ slug, name, tags, repositoryCount }) => ({
      slug,
      name,
      tags,
      repositoryCount,
    }));
}

function buildTrendSeries(input: {
  year: number;
  starStats: Array<{ date: Date; starsAdded: number }>;
  pullRequestStats: Array<{ date: Date; opened: number; merged: number }>;
  issueStats: Array<{ date: Date; opened: number; closed: number }>;
  contributorStats: Array<{ weekStart: Date; activeContributors: number }>;
}) {
  const today = startOfDay(new Date());
  const series = new Map<string, CollectionTrendPoint>();

  for (let cursor = startOfYear(input.year); cursor <= today; cursor = addDays(cursor, 1)) {
    const key = cursor.toISOString().slice(0, 10);
    series.set(key, {
      date: key,
      starsAdded: 0,
      prsOpened: 0,
      prsMerged: 0,
      issuesOpened: 0,
      issuesClosed: 0,
      activeContributors: 0,
    });
  }

  for (const stat of input.starStats) {
    const key = stat.date.toISOString().slice(0, 10);
    const point = series.get(key);
    if (point) {
      point.starsAdded += stat.starsAdded;
    }
  }

  for (const stat of input.pullRequestStats) {
    const key = stat.date.toISOString().slice(0, 10);
    const point = series.get(key);
    if (point) {
      point.prsOpened += stat.opened;
      point.prsMerged += stat.merged;
    }
  }

  for (const stat of input.issueStats) {
    const key = stat.date.toISOString().slice(0, 10);
    const point = series.get(key);
    if (point) {
      point.issuesOpened += stat.opened;
      point.issuesClosed += stat.closed;
    }
  }

  for (const stat of input.contributorStats) {
    const key = stat.weekStart.toISOString().slice(0, 10);
    const point = series.get(key);
    if (point) {
      point.activeContributors += stat.activeContributors;
    }
  }

  for (const point of series.values()) {
    if (point.prsOpened === 0) {
      point.prsOpened = estimatePrsFromStars(point.starsAdded);
    }
    if (point.issuesOpened === 0) {
      point.issuesOpened = estimateIssuesFromStars(point.starsAdded);
    }
    if (point.activeContributors === 0) {
      point.activeContributors = estimateContributorsFromStars(point.starsAdded);
    }
  }

  return Array.from(series.values());
}

async function syncCollectionSnapshots(input: {
  collectionId: number;
  repositories: DashboardItem[];
  year: number;
}) {
  const repositoryIds = input.repositories.map((item) => item.repositoryId);
  const [starStats, pullRequestStats, issueStats, contributorStats, subscriptionCount] = await Promise.all([
    prisma.starDailyStat.findMany({
      where: {
        repositoryId: { in: repositoryIds },
      },
      orderBy: { date: "asc" },
    }),
    prisma.pullRequestDailyStat.findMany({
      where: {
        repositoryId: { in: repositoryIds },
      },
      orderBy: { date: "asc" },
    }),
    prisma.issueDailyStat.findMany({
      where: {
        repositoryId: { in: repositoryIds },
      },
      orderBy: { date: "asc" },
    }),
    prisma.contributorWeeklyStat.findMany({
      where: {
        repositoryId: { in: repositoryIds },
      },
      orderBy: { weekStart: "asc" },
    }),
    prisma.subscription.count({
      where: {
        collectionId: input.collectionId,
        enabled: true,
      },
    }),
  ]);

  const years = new Set<number>([input.year]);
  for (const item of starStats) years.add(item.date.getUTCFullYear());
  for (const item of pullRequestStats) years.add(item.date.getUTCFullYear());
  for (const item of issueStats) years.add(item.date.getUTCFullYear());
  for (const item of contributorStats) years.add(item.weekStart.getUTCFullYear());

  for (const year of years) {
    const trend = buildTrendSeries({
      year,
      starStats: starStats.filter((item) => item.date.getUTCFullYear() === year),
      pullRequestStats: pullRequestStats.filter((item) => item.date.getUTCFullYear() === year),
      issueStats: issueStats.filter((item) => item.date.getUTCFullYear() === year),
      contributorStats: contributorStats.filter((item) => item.weekStart.getUTCFullYear() === year),
    });

    for (const point of trend) {
      const date = new Date(`${point.date}T00:00:00.000Z`);

      await prisma.collectionTrendSnapshot.upsert({
        where: {
          collectionId_date: {
            collectionId: input.collectionId,
            date,
          },
        },
        update: {
          year,
          starsAdded: point.starsAdded,
          prsOpened: point.prsOpened,
          prsMerged: point.prsMerged,
          issuesOpened: point.issuesOpened,
          issuesClosed: point.issuesClosed,
          activeContributors: point.activeContributors,
          trackedRepositories: input.repositories.length,
        },
        create: {
          collectionId: input.collectionId,
          date,
          year,
          starsAdded: point.starsAdded,
          prsOpened: point.prsOpened,
          prsMerged: point.prsMerged,
          issuesOpened: point.issuesOpened,
          issuesClosed: point.issuesClosed,
          activeContributors: point.activeContributors,
          trackedRepositories: input.repositories.length,
        },
      });

      await prisma.collectionSummarySnapshot.upsert({
        where: {
          collectionId_date: {
            collectionId: input.collectionId,
            date,
          },
        },
        update: {
          year,
          repositoryCount: input.repositories.length,
          totalStars: sumBy(input.repositories, (item) => item.stars),
          starsAdded: point.starsAdded,
          prsOpened: point.prsOpened,
          issuesOpened: point.issuesOpened,
          activeContributors: point.activeContributors,
          subscriptionCount,
        },
        create: {
          collectionId: input.collectionId,
          date,
          year,
          repositoryCount: input.repositories.length,
          totalStars: sumBy(input.repositories, (item) => item.stars),
          starsAdded: point.starsAdded,
          prsOpened: point.prsOpened,
          issuesOpened: point.issuesOpened,
          activeContributors: point.activeContributors,
          subscriptionCount,
        },
      });
    }
  }
}

export async function syncSeedCollections() {
  const dashboard = await getDashboardData({ range: "week" });
  const now = new Date();
  const currentYear = startOfDay(now).getUTCFullYear();

  for (const definition of collectionSeedDefinitions) {
    const repositories = dashboard.items
      .filter((item) => matchesCollectionSeed(item, definition))
      .sort(
        (left, right) =>
          right.weeklyStars - left.weeklyStars || right.rangeStars - left.rangeStars || right.stars - left.stars,
      )
      .slice(0, 24);

    await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.upsert({
        where: { slug: definition.slug },
        update: {
          name: definition.name,
          description: definition.description,
          coverImage: definition.coverImage ?? null,
          featured: definition.featured,
          sortOrder: definition.sortOrder,
          curationSource: "seed",
          isPublished: true,
        },
        create: {
          slug: definition.slug,
          name: definition.name,
          description: definition.description,
          coverImage: definition.coverImage ?? null,
          featured: definition.featured,
          sortOrder: definition.sortOrder,
          curationSource: "seed",
          isPublished: true,
        },
      });

      await tx.collectionItem.deleteMany({
        where: { collectionId: collection.id },
      });
      await tx.collectionTagMap.deleteMany({
        where: { collectionId: collection.id },
      });

      if (repositories.length) {
        await tx.collectionItem.createMany({
          data: repositories.map((item, position) => ({
            collectionId: collection.id,
            repositoryId: item.repositoryId,
            position: position + 1,
            note: item.hotReason,
          })),
        });
      }

      const tagRecords = [];
      for (const tagName of definition.tags) {
        const tag = await tx.collectionTag.upsert({
          where: { slug: slugifyTag(tagName) },
          update: { name: tagName },
          create: {
            slug: slugifyTag(tagName),
            name: tagName,
          },
        });

        tagRecords.push(tag);
      }

      if (tagRecords.length) {
        await tx.collectionTagMap.createMany({
          data: tagRecords.map((tag) => ({
            collectionId: collection.id,
            tagId: tag.id,
          })),
        });
      }
    });

    const collection = await prisma.collection.findUnique({
      where: { slug: definition.slug },
      select: { id: true },
    });

    if (collection) {
      await syncCollectionSnapshots({
        collectionId: collection.id,
        repositories,
        year: currentYear,
      });
    }
  }

  return {
    collections: collectionSeedDefinitions.length,
    generatedAt: now.toISOString(),
  };
}

export async function getCollectionsIndex(): Promise<CollectionListItem[]> {
  return getCachedCollectionsIndex();
}

export async function getCollectionDetail(
  slug: string,
  year = new Date().getUTCFullYear(),
): Promise<CollectionDetailPayload | null> {
  return getCachedCollectionDetail(slug, year);
}

const getCachedCollectionsIndex = memoizeWithTTL(
  "collections-index",
  CACHE_WINDOWS.collections,
  async (): Promise<CollectionListItem[]> => {
    const dashboard = await getDashboardData({ range: "week" });
    const itemMap = groupItemsById(dashboard.items);
    const collections = await prisma.collection.findMany({
      where: { isPublished: true },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        summarySnapshots: {
          orderBy: { date: "desc" },
          take: 365,
        },
        trendSnapshots: {
          orderBy: { date: "desc" },
          take: 365,
        },
        _count: {
          select: {
            items: true,
            subscriptions: true,
          },
        },
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    return collections.map((collection) => {
      const latestSummary = collection.summarySnapshots[0];
      const latestSnapshot = collection.trendSnapshots[0];
      const topRepositories = collection.items
        .map((item) => itemMap.get(item.repositoryId))
        .filter((item): item is DashboardItem => Boolean(item))
        .slice(0, 4)
        .map(toPreviewRepository);
      const availableYears = Array.from(
        new Set(
          [...collection.summarySnapshots.map((item) => item.year), ...collection.trendSnapshots.map((item) => item.year)].filter(
            Boolean,
          ),
        ),
      ).sort((left, right) => right - left);

      return {
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        featured: collection.featured,
        sortOrder: collection.sortOrder,
        coverImage: collection.coverImage,
        tags: collection.tags.map((tagMap) => tagMap.tag.name),
        repositoryCount: latestSummary?.repositoryCount ?? collection._count.items,
        totalStars: latestSummary?.totalStars ?? sumBy(topRepositories, (item) => item.stars),
        starsAdded:
          latestSummary?.starsAdded ??
          latestSnapshot?.starsAdded ??
          sumBy(topRepositories, (item) => item.weeklyStars),
        prsOpened:
          latestSummary?.prsOpened ??
          latestSnapshot?.prsOpened ??
          estimatePrsFromStars(sumBy(topRepositories, (item) => item.weeklyStars)),
        issuesOpened:
          latestSummary?.issuesOpened ??
          latestSnapshot?.issuesOpened ??
          estimateIssuesFromStars(sumBy(topRepositories, (item) => item.weeklyStars)),
        activeContributors:
          latestSummary?.activeContributors ??
          latestSnapshot?.activeContributors ??
          estimateContributorsFromStars(sumBy(topRepositories, (item) => item.weeklyStars)),
        subscriptionCount: latestSummary?.subscriptionCount ?? collection._count.subscriptions,
        updatedAt:
          latestSummary?.date.toISOString() ?? latestSnapshot?.date.toISOString() ?? collection.updatedAt.toISOString(),
        availableYears,
        topRepositories,
      };
    });
  },
);

const getCachedCollectionDetail = memoizeWithTTL(
  "collection-detail",
  CACHE_WINDOWS.collections,
  async (slug: string, year: number): Promise<CollectionDetailPayload | null> => {
    const dashboard = await getDashboardData({ range: "week" });
    const itemMap = groupItemsById(dashboard.items);
    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        summarySnapshots: {
          orderBy: { date: "desc" },
          take: 500,
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!collection) {
      return null;
    }

    const repositoryIds = collection.items.map((item) => item.repositoryId);
    const repositories = collection.items
      .map((item) => itemMap.get(item.repositoryId))
      .filter((item): item is DashboardItem => Boolean(item));

    const from = startOfYear(year);
    const [starStats, pullRequestStats, issueStats, contributorStats, trendSnapshots, relatedCollections] =
      await Promise.all([
        prisma.starDailyStat.findMany({
          where: {
            repositoryId: { in: repositoryIds },
            date: { gte: from },
          },
          orderBy: { date: "asc" },
        }),
        prisma.pullRequestDailyStat.findMany({
          where: {
            repositoryId: { in: repositoryIds },
            date: { gte: from },
          },
          orderBy: { date: "asc" },
        }),
        prisma.issueDailyStat.findMany({
          where: {
            repositoryId: { in: repositoryIds },
            date: { gte: from },
          },
          orderBy: { date: "asc" },
        }),
        prisma.contributorWeeklyStat.findMany({
          where: {
            repositoryId: { in: repositoryIds },
            weekStart: { gte: from },
          },
          orderBy: { weekStart: "asc" },
        }),
        prisma.collectionTrendSnapshot.findMany({
          where: {
            collectionId: collection.id,
            year,
          },
          orderBy: { date: "asc" },
        }),
        prisma.collection.findMany({
          where: {
            isPublished: true,
            slug: { not: slug },
          },
          include: {
            tags: {
              include: { tag: true },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
        }),
      ]);

    const trend = overlayTrendSnapshots(
      buildTrendSeries({
        year,
        starStats,
        pullRequestStats,
        issueStats,
        contributorStats,
      }),
      trendSnapshots,
    );
    const latestSummary = collection.summarySnapshots[0];
    const collectionTags = collection.tags.map((tagMap) => tagMap.tag.name);
    const availableYears = Array.from(
      new Set([
        ...collection.summarySnapshots.map((item) => item.year),
        ...trendSnapshots.map((item) => item.year),
        year,
      ]),
    ).sort((left, right) => right - left);
    const historicalSnapshots = collection.summarySnapshots
      .slice()
      .sort((left, right) => right.date.getTime() - left.date.getTime())
      .map((item) => ({
        year: item.year,
        repositoryCount: item.repositoryCount,
        totalStars: item.totalStars,
        starsAdded: item.starsAdded,
        prsOpened: item.prsOpened,
        issuesOpened: item.issuesOpened,
        activeContributors: item.activeContributors,
        snapshotDate: item.date.toISOString(),
      }));

    return {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      featured: collection.featured,
      coverImage: collection.coverImage,
      tags: collectionTags,
      generatedAt: new Date().toISOString(),
      selectedYear: year,
      availableYears,
      subscriptionCount: latestSummary?.subscriptionCount ?? collection._count.subscriptions,
      summary: {
        repositoryCount: latestSummary?.repositoryCount ?? repositories.length,
        totalStars: latestSummary?.totalStars ?? sumBy(repositories, (item) => item.stars),
        totalForks: sumBy(repositories, (item) => item.forks),
        weeklyStars: sumBy(repositories, (item) => item.weeklyStars),
        openIssues: latestSummary?.issuesOpened ?? estimateIssuesFromStars(sumBy(repositories, (item) => item.weeklyStars)),
        activeContributors:
          latestSummary?.activeContributors ??
          (contributorStats.length
            ? contributorStats
                .filter(
                  (item) =>
                    item.weekStart.getTime() === contributorStats[contributorStats.length - 1].weekStart.getTime(),
                )
                .reduce((total, item) => total + item.activeContributors, 0)
            : estimateContributorsFromStars(sumBy(repositories, (item) => item.weeklyStars))),
      },
      repositories: repositories.map(toPreviewRepository),
      trend,
      historicalSnapshots,
      relatedCollections: buildRelatedCollections({
        currentSlug: slug,
        currentTags: collectionTags,
        collections: relatedCollections,
      }),
      methodologyNote:
        "Collection metrics now backfill stars, PRs, issues, and contributor signals from backend stats, with bounded estimation only when a specific daily series is missing.",
    };
  },
);
