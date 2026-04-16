export type DashboardRange = "today" | "week" | "month" | "custom" | "snapshot";

export type DashboardItem = {
  repositoryId: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  weeklyStars: number;
  todayStars: number;
  monthlyStars: number;
  rangeStars: number;
  rangeLabel: string;
  score: number;
  hotReason: string;
  healthScore: number;
  issuePressure: number;
  lastPushedAt: string | null;
  lastCollectedAt: string;
  weeklyHistoryReady: boolean;
  weeklyHistoryComplete: boolean;
  todayHistoryReady: boolean;
  rangeHistoryReady: boolean;
  rangeHistoryComplete: boolean;
  historyCoverageDays: number;
};

export type DashboardSummary = {
  totalProjects: number;
  totalStars: number;
  totalForks: number;
  totalRangeStars: number;
  totalWeeklyStars: number;
  topLanguage: string;
  freshestProject: string | null;
  weeklyCoverageDays: number;
  weeklyCoverageComplete: boolean;
};

export type HeatmapCell = {
  date: string;
  value: number;
};

export type DashboardPayload = {
  generatedAt: string;
  lastFetchedAt: string | null;
  range: DashboardRange;
  rangeLabel: string;
  from: string | null;
  to: string | null;
  weekKey: string | null;
  availableWeeks: string[];
  availableLanguages: string[];
  items: DashboardItem[];
  summary: DashboardSummary;
  heatmap: HeatmapCell[];
};

export type RepositoryContributor = {
  login: string;
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
};

export type RepositoryRecommendation = {
  fullName: string;
  htmlUrl: string;
  language: string | null;
  stars: number;
  weeklyStars: number;
};

export type RepositoryDetailPayload = {
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  updatedAt: string | null;
  readmeSummary: string | null;
  contributors: RepositoryContributor[];
  health: {
    score: number;
    issueResponseHours: number | null;
    prMergeRate: number | null;
    recentPushDays: number | null;
  };
  rankings: Array<{
    weekKey: string;
    rank: number;
    starDelta7d: number;
    score: number;
  }>;
  snapshots: Array<{
    fetchedAt: string;
    stars: number;
    forks: number;
  }>;
  recommendations: RepositoryRecommendation[];
};

export type CollectionPreviewRepository = {
  repositoryId: number;
  fullName: string;
  owner: string;
  name: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  weeklyStars: number;
  rangeStars: number;
  stars: number;
  forks: number;
  hotReason: string;
};

export type CollectionListItem = {
  slug: string;
  name: string;
  description: string;
  featured: boolean;
  sortOrder: number;
  coverImage: string | null;
  tags: string[];
  repositoryCount: number;
  totalStars: number;
  starsAdded: number;
  prsOpened: number;
  issuesOpened: number;
  activeContributors: number;
  subscriptionCount: number;
  updatedAt: string;
  availableYears: number[];
  topRepositories: CollectionPreviewRepository[];
};

export type CollectionRelatedItem = {
  slug: string;
  name: string;
  tags: string[];
  repositoryCount: number;
};

export type CollectionTrendPoint = {
  date: string;
  starsAdded: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  activeContributors: number;
};

export type CollectionDetailPayload = {
  id: number;
  slug: string;
  name: string;
  description: string;
  featured: boolean;
  coverImage: string | null;
  tags: string[];
  generatedAt: string;
  selectedYear: number;
  availableYears: number[];
  subscriptionCount: number;
  summary: {
    repositoryCount: number;
    totalStars: number;
    totalForks: number;
    weeklyStars: number;
    openIssues: number;
    activeContributors: number;
  };
  repositories: CollectionPreviewRepository[];
  trend: CollectionTrendPoint[];
  historicalSnapshots: Array<{
    year: number;
    repositoryCount: number;
    totalStars: number;
    starsAdded: number;
    prsOpened: number;
    issuesOpened: number;
    activeContributors: number;
    snapshotDate: string;
  }>;
  relatedCollections: CollectionRelatedItem[];
  methodologyNote: string;
};
