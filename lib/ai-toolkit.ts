import { prisma } from "@/lib/db";
import { getDashboardData } from "@/lib/dashboard";
import { CACHE_WINDOWS } from "@/lib/http-cache";
import { listRecentJobRuns } from "@/lib/jobs";
import { getMethodologySections } from "@/lib/methodology";
import { memoizeWithTTL } from "@/lib/runtime-cache";

export async function buildAiContext() {
  return getCachedAiContext();
}

async function fetchAiContext() {
  const [repoCount, snapshotCount, rankingCount, subscriptionCount, jobCount, latestSnapshot, dashboard, jobs] =
    await Promise.all([
      prisma.repository.count(),
      prisma.snapshot.count(),
      prisma.weeklyRanking.count(),
      prisma.subscription.count(),
      prisma.jobRun.count(),
      prisma.snapshot.findFirst({
        orderBy: { fetchedAt: "desc" },
        select: { fetchedAt: true },
      }),
      getDashboardData({ range: "week" }),
      listRecentJobRuns(5),
    ]);

  return {
    project: "Open Source Trend Intelligence Desk",
    purpose: "Collect, rank, and present GitHub open-source momentum with snapshots, collections, and operator-friendly outputs.",
    audiences: [
      {
        role: "Developer / researcher",
        useCase: "Discover rising repositories, inspect momentum, and export ranked lists quickly.",
      },
      {
        role: "Content / community operator",
        useCase: "Track hot repositories, curate collections, and export weekly summaries for publishing.",
      },
      {
        role: "Internal tool or AI agent",
        useCase: "Consume structured JSON, repository dossiers, and backend-friendly API payloads.",
      },
    ],
    commands: [
      "npm run collect:daily",
      "npm run sync:stars",
      "npm run build:weekly",
      "npm run collections:sync",
      "npm run pipeline:run",
      "npm run ai:context",
      "npm run ai:report",
      "npm run ai:repo -- owner/name",
      "npm run gitnexus:analyze",
    ],
    quickStart: [
      "Run `npm run ai:context` to inspect the current product-manual JSON.",
      "If dashboard data just changed, run `npm run collect:daily` and `npm run build:weekly`.",
      "If collection content changed, run `npm run collections:sync` before opening the gallery pages.",
      "After structural code changes, run `npm run gitnexus:analyze` to refresh the code graph.",
    ],
    cliSetup: {
      prerequisites: [
        "Install dependencies with `npm install`.",
        "Generate the Prisma client with `npm run prisma:generate`.",
        "Initialize the database with `npm run db:push`.",
        "Set `GITHUB_TOKEN` in `.env` for authenticated GitHub collection runs.",
      ],
      note: "CLI commands are the operator-facing entry points for collection, diagnostics, exports, and manual data refresh.",
    },
    cliRecipes: [
      {
        goal: "Refresh repository candidates and snapshots",
        command: "npm run collect:daily",
      },
      {
        goal: "Backfill recent stargazer history when GitHub token coverage is available",
        command: "npm run sync:stars",
      },
      {
        goal: "Rebuild the weekly ranking after new snapshots arrive",
        command: "npm run build:weekly",
      },
      {
        goal: "Seed or refresh curated collections",
        command: "npm run collections:sync",
      },
      {
        goal: "Run the full backend ingestion and ranking pipeline",
        command: "npm run pipeline:run",
      },
    ],
    apiRoutes: [
      { route: "/api/dashboard", purpose: "Dashboard data payload" },
      { route: "/api/collections", purpose: "Collections gallery index" },
      { route: "/api/collections/[slug]", purpose: "Collection detail payload" },
      { route: "/api/subscriptions", purpose: "Keyword or collection subscription create/list" },
      { route: "/api/ai/context", purpose: "Product manual context JSON" },
      { route: "/api/report", purpose: "Weekly markdown report" },
    ],
    freshness: {
      generatedAt: dashboard.generatedAt,
      latestSnapshotAt: latestSnapshot?.fetchedAt.toISOString() ?? null,
      latestJobStatus: jobs[0]?.status ?? null,
      latestJobType: jobs[0]?.jobType ?? null,
      note: "Frontend pages are read-only. Collection, ranking, and snapshot freshness depend on backend jobs and CLI runs.",
    },
    subscriptionGuide: [
      {
        title: "Collection follow from the UI",
        description:
          "Open a collection detail page, submit the subscribe form, and the backend will persist a collection-level follow record.",
      },
      {
        title: "Subscription center review",
        description:
          "Use `/{locale}/subscriptions` to review the collection follows and keyword alerts stored by the backend.",
      },
      {
        title: "Programmatic create",
        description:
          "Send `POST /api/subscriptions` with `collectionId` or `keywords` to create a subscription record from internal tooling or automation.",
      },
      {
        title: "Current delivery boundary",
        description:
          "This version stores subscription intent and follow relationships first. Full outbound delivery jobs are a separate backend milestone.",
      },
    ],
    subscriptionPayloadExample: {
      email: "ops@example.com",
      locale: "zh-CN",
      channel: "email",
      subscriptionType: "collection",
      digestFrequency: "weekly",
      collectionId: "{{collectionId}}",
    },
    exportFormats: [
      {
        format: "CSV",
        source: "Dashboard export button",
        purpose: "Export the currently filtered repository rows for spreadsheet analysis.",
        notes: "Best for operations, ranking review, and manual sharing.",
      },
      {
        format: "JSON",
        source: "Dashboard export button and `npm run ai:context`",
        purpose: "Export structured dashboard rows or machine-readable product context.",
        notes: "Use for internal tools, agents, and downstream automation.",
      },
      {
        format: "Markdown",
        source: "Dashboard report export and `npm run ai:report`",
        purpose: "Export weekly summaries that are ready for publishing or team updates.",
        notes: "Best for newsletters, changelogs, and editorial workflows.",
      },
      {
        format: "Repository dossier JSON",
        source: "`npm run ai:repo -- owner/name`",
        purpose: "Export a single repository profile with rankings, snapshots, and recent star history.",
        notes: "Best when one repository matters more than the whole dashboard.",
      },
    ],
    exportFieldGuide: [
      {
        field: "fullName",
        meaning: "Repository owner/name identifier used across dashboard, exports, and dossiers.",
      },
      {
        field: "weeklyStars",
        meaning: "Best-effort star growth in the latest weekly window, capped at 7 days.",
      },
      {
        field: "todayStars",
        meaning: "Star growth since local midnight based on comparable snapshots.",
      },
      {
        field: "stars",
        meaning: "Current total stargazer count from the latest repository snapshot.",
      },
      {
        field: "historyCoverageDays",
        meaning: "How many days of comparable history currently support weekly-star calculation.",
      },
    ],
    troubleshooting: [
      {
        problem: "Today stars and weekly stars look identical",
        fix: "Run `npm run collect:daily` again and refresh the page. The app now calculates today from midnight and week with up to 7 days of best-effort history.",
      },
      {
        problem: "Weekly stars show partial coverage",
        fix: "This is expected when fewer than 7 days of comparable snapshots exist. The UI and the manual JSON mark the current coverage explicitly.",
      },
      {
        problem: "Collection pages look stale after data jobs",
        fix: "Run `npm run collections:sync` after repository ingestion so collection summaries and cards rebuild from the latest repository data.",
      },
      {
        problem: "A subscription was created but no digest was delivered",
        fix: "The current product persists subscription records first. Delivery jobs and outbound channels are planned as a later backend layer.",
      },
      {
        problem: "GitNexus impact analysis reports a stale or locked graph",
        fix: "Run `npm run gitnexus:analyze`. If the local graph lock persists, close the conflicting process and rerun the command.",
      },
    ],
    limitations: [
      "Subscriptions persist intent today, but outbound digest delivery is still a future backend milestone.",
      "PR, issue, and contributor collection trends are scaffolded in the data model but not fully populated yet.",
      "Weekly stars can be partial until enough comparable snapshots accumulate.",
      "The `/ai` route remains for compatibility, even though the page is now the product manual.",
    ],
    stats: {
      repositories: repoCount,
      snapshots: snapshotCount,
      weeklyRankings: rankingCount,
      subscriptions: subscriptionCount,
      jobs: jobCount,
    },
    latestWeek: dashboard.weekKey ?? dashboard.availableWeeks[0] ?? null,
    summary: dashboard.summary,
    starSemantics: {
      weeklyWindowDays: 7,
      weeklyCoverageDays: dashboard.summary.weeklyCoverageDays,
      weeklyCoverageComplete: dashboard.summary.weeklyCoverageComplete,
      note: dashboard.summary.weeklyCoverageComplete
        ? "Weekly stars have full 7-day coverage."
        : "Weekly stars currently use best-effort coverage up to the latest available snapshots, capped at 7 days.",
    },
    topRepositories: dashboard.items.slice(0, 10).map((item) => ({
      fullName: item.fullName,
      language: item.language,
      weeklyStars: item.weeklyHistoryReady ? item.weeklyStars : null,
      weeklyCoverageDays: item.historyCoverageDays,
      weeklyHistoryComplete: item.weeklyHistoryComplete,
      totalStars: item.stars,
      hotReason: item.hotReason,
    })),
    recentJobs: jobs.map((job) => ({
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      triggeredBy: job.triggeredBy,
      startedAt: job.startedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
    })),
    methodology: getMethodologySections(),
    coreFiles: [
      "app/[locale]/page.tsx",
      "app/[locale]/ai/page.tsx",
      "components/dashboard-app.tsx",
      "components/site-header.tsx",
      "components/collection-subscribe-form.tsx",
      "app/[locale]/subscriptions/page.tsx",
      "app/api/subscriptions/route.ts",
      "lib/dashboard.ts",
      "lib/ranking.ts",
      "lib/star-history.ts",
      "lib/collections.ts",
      "lib/subscriptions.ts",
      "lib/ai-toolkit.ts",
      "prisma/schema.prisma",
    ],
  };
}

export async function buildAiReport() {
  return getCachedAiReport();
}

async function fetchAiReport() {
  const dashboard = await getDashboardData({ range: "week" });
  const coverageText = dashboard.summary.weeklyCoverageComplete
    ? "full 7d"
    : `${Math.max(dashboard.summary.weeklyCoverageDays, 1)}d partial`;
  const lines = [
    "# Open Source Trend Intelligence Desk Weekly Report",
    "",
    `Generated at: ${dashboard.generatedAt}`,
    `Range: ${dashboard.rangeLabel}`,
    "",
    "## Summary",
    "",
    `- Projects tracked: ${dashboard.summary.totalProjects}`,
    `- Stars in selected range: ${dashboard.summary.totalRangeStars}`,
    `- Weekly stars: ${dashboard.summary.totalWeeklyStars}`,
    `- Weekly coverage: ${coverageText}`,
    `- Top language: ${dashboard.summary.topLanguage}`,
    "",
    "## Top 20",
    "",
    "| Rank | Repository | Language | Weekly Stars | Coverage | Total Stars | Hot Reason |",
    "| --- | --- | --- | ---: | --- | ---: | --- |",
    ...dashboard.items.slice(0, 20).map(
      (item, index) =>
        `| ${index + 1} | ${item.fullName} | ${item.language ?? "-"} | ${item.weeklyHistoryReady ? item.weeklyStars : "--"} | ${
          item.weeklyHistoryComplete ? "7d" : `${Math.max(item.historyCoverageDays, 1)}d partial`
        } | ${item.stars} | ${item.hotReason} |`,
    ),
  ];

  return lines.join("\n");
}

const getCachedAiContext = memoizeWithTTL("ai-context", CACHE_WINDOWS.manual, fetchAiContext);

const getCachedAiReport = memoizeWithTTL("ai-report", CACHE_WINDOWS.manual, fetchAiReport);

export async function buildRepositoryDossier(fullName: string) {
  const repository = await prisma.repository.findUnique({
    where: { fullName },
    include: {
      rankings: { orderBy: [{ weekKey: "desc" }, { rank: "asc" }], take: 12 },
      starDailyStats: { orderBy: { date: "desc" }, take: 30 },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 12 },
    },
  });

  if (!repository) {
    return null;
  }

  return {
    fullName: repository.fullName,
    description: repository.description,
    language: repository.language,
    htmlUrl: repository.htmlUrl,
    cloneUrl: `${repository.htmlUrl}.git`,
    stars: repository.stars,
    forks: repository.forks,
    pushedAt: repository.pushedAtGh?.toISOString() ?? null,
    rankings: repository.rankings.map((item) => ({
      weekKey: item.weekKey,
      rank: item.rank,
      starDelta7d: item.starDelta7d,
      score: item.score,
    })),
    recentDailyStars: repository.starDailyStats.map((item) => ({
      date: item.date.toISOString().slice(0, 10),
      starsAdded: item.starsAdded,
    })),
    recentSnapshots: repository.snapshots.map((item) => ({
      fetchedAt: item.fetchedAt.toISOString(),
      stars: item.stars,
      forks: item.forks,
    })),
  };
}
