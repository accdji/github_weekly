const requiredVariables = [
  "DATABASE_URL",
  "GITHUB_TOP_LANGUAGES",
  "COLLECT_PER_QUERY",
  "GITHUB_STAR_HISTORY_DAYS",
  "GITHUB_STAR_HISTORY_MAX_PAGES",
] as const;

function fail(message: string): never {
  console.error(`[env:check:prod] ${message}`);
  process.exit(1);
}

for (const key of requiredVariables) {
  const value = process.env[key];
  if (!value || !value.trim()) {
    fail(`Missing required environment variable: ${key}`);
  }
}

const databaseUrl = process.env.DATABASE_URL ?? "";
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  fail("DATABASE_URL must start with postgresql:// or postgres://");
}

const gitHubToken = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
if (!gitHubToken.trim()) {
  console.warn("[env:check:prod] GH_TOKEN is missing. The pipeline can still run, but GitHub API rate limits may reduce stability.");
}

const collectPerQuery = Number(process.env.COLLECT_PER_QUERY);
if (!Number.isFinite(collectPerQuery) || collectPerQuery <= 0) {
  fail("COLLECT_PER_QUERY must be a positive number");
}

const starHistoryDays = Number(process.env.GITHUB_STAR_HISTORY_DAYS);
if (!Number.isFinite(starHistoryDays) || starHistoryDays <= 0) {
  fail("GITHUB_STAR_HISTORY_DAYS must be a positive number");
}

const starHistoryMaxPages = Number(process.env.GITHUB_STAR_HISTORY_MAX_PAGES);
if (!Number.isFinite(starHistoryMaxPages) || starHistoryMaxPages <= 0) {
  fail("GITHUB_STAR_HISTORY_MAX_PAGES must be a positive number");
}

console.log("[env:check:prod] Production environment variables look valid.");
