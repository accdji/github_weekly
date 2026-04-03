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
  healthScore: number;
  issuePressure: number;
  lastPushedAt: string | null;
  lastCollectedAt: string;
  weeklyHistoryReady: boolean;
  todayHistoryReady: boolean;
  rangeHistoryReady: boolean;
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
