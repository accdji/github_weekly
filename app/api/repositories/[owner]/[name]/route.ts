import { prisma } from "@/lib/db";
import { getGitHubRepositoryDetails } from "@/lib/github";
import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";
import { memoizeWithTTL } from "@/lib/runtime-cache";
import type { RepositoryDetailPayload } from "@/lib/dashboard-types";

export const revalidate = 600;

type Context = {
  params: Promise<{
    owner: string;
    name: string;
  }>;
};

function parseTopics(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function computeDetailHealth({
  stars,
  openIssues,
  pushedAt,
  issueResponseHours,
  prMergeRate,
}: {
  stars: number;
  openIssues: number;
  pushedAt: Date | null;
  issueResponseHours: number | null;
  prMergeRate: number | null;
}) {
  const recencyDays = pushedAt ? Math.max(0, (Date.now() - pushedAt.getTime()) / 86400000) : 365;
  const recencyScore = Math.max(0, 35 - recencyDays);
  const issueScore = issueResponseHours === null ? 10 : Math.max(0, 25 - issueResponseHours * 0.6);
  const prScore = prMergeRate === null ? 10 : prMergeRate * 0.25;
  const scaleScore = Math.min(20, Math.log10(Math.max(stars, 10)) * 6);
  const pressurePenalty = Math.min(18, openIssues * 0.12);

  return Number(Math.max(0, Math.min(100, recencyScore + issueScore + prScore + scaleScore - pressurePenalty)).toFixed(1));
}

async function buildRepositoryDetailPayload(fullName: string, owner: string, name: string): Promise<RepositoryDetailPayload | null> {
  const repository = await prisma.repository.findUnique({
    where: { fullName },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "asc" },
        take: 90,
      },
      rankings: {
        orderBy: [{ weekKey: "desc" }, { rank: "asc" }],
        take: 24,
      },
    },
  });

  if (!repository) {
    return null;
  }

  let liveDetails:
    | Awaited<ReturnType<typeof getGitHubRepositoryDetails>>
    | {
        repository: null;
        contributors: [];
        readmeSummary: null;
        issueResponseHours: null;
        prMergeRate: null;
      };

  try {
    liveDetails = await getGitHubRepositoryDetails(owner, name);
  } catch {
    liveDetails = {
      repository: null,
      contributors: [],
      readmeSummary: null,
      issueResponseHours: null,
      prMergeRate: null,
    };
  }

  const latestRanking = await prisma.weeklyRanking.findFirst({
    where: {
      repositoryId: repository.id,
    },
    orderBy: [{ weekKey: "desc" }, { rank: "asc" }],
  });

  const recommendations = await prisma.repository.findMany({
    where: {
      language: repository.language,
      id: {
        not: repository.id,
      },
    },
    orderBy: {
      stars: "desc",
    },
    take: 4,
  });

  const payload: RepositoryDetailPayload = {
    fullName: repository.fullName,
    htmlUrl: repository.htmlUrl,
    cloneUrl: liveDetails.repository?.clone_url ?? `${repository.htmlUrl}.git`,
    description: repository.description,
    language: repository.language,
    topics: parseTopics(repository.topicsJson),
    stars: repository.stars,
    forks: repository.forks,
    openIssues: repository.openIssues,
    pushedAt: repository.pushedAtGh?.toISOString() ?? null,
    updatedAt: repository.updatedAtGh?.toISOString() ?? null,
    readmeSummary: liveDetails.readmeSummary,
    contributors: liveDetails.contributors,
    health: {
      score: computeDetailHealth({
        stars: repository.stars,
        openIssues: repository.openIssues,
        pushedAt: repository.pushedAtGh,
        issueResponseHours: liveDetails.issueResponseHours,
        prMergeRate: liveDetails.prMergeRate,
      }),
      issueResponseHours: liveDetails.issueResponseHours,
      prMergeRate: liveDetails.prMergeRate,
      recentPushDays: repository.pushedAtGh
        ? Number(((Date.now() - repository.pushedAtGh.getTime()) / 86400000).toFixed(1))
        : null,
    },
    rankings: repository.rankings.map((ranking) => ({
      weekKey: ranking.weekKey,
      rank: ranking.rank,
      starDelta7d: ranking.starDelta7d,
      score: ranking.score,
    })),
    snapshots: repository.snapshots.map((snapshot) => ({
      fetchedAt: snapshot.fetchedAt.toISOString(),
      stars: snapshot.stars,
      forks: snapshot.forks,
    })),
    recommendations: recommendations.map((item) => ({
      fullName: item.fullName,
      htmlUrl: item.htmlUrl,
      language: item.language,
      stars: item.stars,
      weeklyStars: 0,
    })),
  };

  if (latestRanking && !payload.rankings.some((ranking) => ranking.weekKey === latestRanking.weekKey)) {
    payload.rankings.unshift({
      weekKey: latestRanking.weekKey,
      rank: latestRanking.rank,
      starDelta7d: latestRanking.starDelta7d,
      score: latestRanking.score,
    });
  }

  return payload;
}

const getCachedRepositoryDetailPayload = memoizeWithTTL(
  "repository-detail-payload",
  CACHE_WINDOWS.repository,
  async (fullName: string, owner: string, name: string) => buildRepositoryDetailPayload(fullName, owner, name),
);

export async function GET(_: Request, context: Context) {
  const params = await context.params;
  const fullName = `${params.owner}/${params.name}`;
  const payload = await getCachedRepositoryDetailPayload(fullName, params.owner, params.name);

  if (!payload) {
    return new Response("Not found", { status: 404 });
  }

  return jsonWithCache(payload, CACHE_WINDOWS.repository);
}
