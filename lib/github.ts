const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  clone_url?: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  topics?: string[];
  created_at: string;
  pushed_at: string | null;
  updated_at: string | null;
};

type SearchResponse = {
  items: GitHubRepository[];
};

type GitHubContributor = {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
};

type GitHubPullRequest = {
  merged_at: string | null;
};

type GitHubIssue = {
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

type StargazersGraphqlResult = {
  repository: {
    stargazers: {
      edges: Array<{
        starredAt: string;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  } | null;
};

function buildHeaders(accept?: string) {
  const headers: Record<string, string> = {
    Accept: accept ?? "application/vnd.github+json",
    "User-Agent": "open-source-trend-intelligence-desk",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export function hasGitHubToken() {
  return Boolean(process.env.GITHUB_TOKEN);
}

async function githubFetch<T>(path: string, accept?: string) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: buildHeaders(accept),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

async function githubFetchText(path: string, accept: string) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: buildHeaders(accept),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.text();
}

async function githubGraphqlFetch<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      ...buildHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL error ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GitHub GraphQL returned no data");
  }

  return payload.data;
}

function getLanguageQueries(): string[] {
  const envValue = process.env.GITHUB_TOP_LANGUAGES ?? "TypeScript,JavaScript,Python,Go,Rust";
  return envValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDefaultSearchQuery() {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
  const isoDate = windowStart.toISOString().slice(0, 10);
  return `stars:>100 pushed:>=${isoDate} archived:false`;
}

function summarizeReadme(markdown: string) {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[>*_-]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, 420) || null;
}

export async function searchCandidateRepositories(): Promise<GitHubRepository[]> {
  const baseQuery = process.env.GITHUB_SEARCH_QUERY ?? getDefaultSearchQuery();
  const perPage = Number(process.env.COLLECT_PER_QUERY ?? "20");
  const deduped = new Map<number, GitHubRepository>();
  const queries = [baseQuery, ...getLanguageQueries().map((language) => `${baseQuery} language:${language}`)];

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      sort: "stars",
      order: "desc",
      per_page: String(perPage),
      page: "1",
    });
    const result = await githubFetch<SearchResponse>(`/search/repositories?${params.toString()}`);

    for (const repo of result.items) {
      deduped.set(repo.id, repo);
    }
  }

  return Array.from(deduped.values());
}

export async function getGitHubRepositoryDetails(owner: string, name: string) {
  const [repository, contributors, pulls, issues] = await Promise.all([
    githubFetch<GitHubRepository>(`/repos/${owner}/${name}`),
    githubFetch<GitHubContributor[]>(`/repos/${owner}/${name}/contributors?per_page=6`),
    githubFetch<GitHubPullRequest[]>(`/repos/${owner}/${name}/pulls?state=closed&per_page=20`),
    githubFetch<GitHubIssue[]>(`/repos/${owner}/${name}/issues?state=all&per_page=20`),
  ]);

  let readmeSummary: string | null = null;

  try {
    const readme = await githubFetchText(`/repos/${owner}/${name}/readme`, "application/vnd.github.raw+json");
    readmeSummary = summarizeReadme(readme);
  } catch {
    readmeSummary = null;
  }

  const issueSamples = issues.filter((issue) => !issue.pull_request).slice(0, 10);
  const issueResponseHours = issueSamples.length
    ? Number(
        (
          issueSamples.reduce((sum, issue) => {
            const created = new Date(issue.created_at).getTime();
            const updated = new Date(issue.updated_at).getTime();
            return sum + Math.max(0, (updated - created) / 3600000);
          }, 0) / issueSamples.length
        ).toFixed(1),
      )
    : null;
  const prMergeRate = pulls.length
    ? Number(((pulls.filter((pull) => Boolean(pull.merged_at)).length / pulls.length) * 100).toFixed(1))
    : null;

  return {
    repository,
    contributors: contributors.map((contributor) => ({
      login: contributor.login,
      avatarUrl: contributor.avatar_url,
      contributions: contributor.contributions,
      htmlUrl: contributor.html_url,
    })),
    readmeSummary,
    issueResponseHours,
    prMergeRate,
  };
}

export async function fetchRecentStarredAtDates(owner: string, name: string, since: Date) {
  if (!hasGitHubToken()) {
    return [];
  }

  const query = `
    query RepositoryStargazers($owner: String!, $name: String!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        stargazers(first: 100, after: $cursor, orderBy: { field: STARRED_AT, direction: DESC }) {
          edges {
            starredAt
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const maxPages = Number(process.env.GITHUB_STAR_HISTORY_MAX_PAGES ?? "20");
  let cursor: string | null = null;
  let page = 0;
  const collected: string[] = [];
  let shouldContinue = true;

  while (shouldContinue && page < maxPages) {
    const result: StargazersGraphqlResult = await githubGraphqlFetch<StargazersGraphqlResult>(query, {
      owner,
      name,
      cursor,
    });

    const connection = result.repository?.stargazers;

    if (!connection) {
      break;
    }

    for (const edge of connection.edges) {
      if (new Date(edge.starredAt) < since) {
        shouldContinue = false;
        break;
      }

      collected.push(edge.starredAt);
    }

    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
      break;
    }

    cursor = connection.pageInfo.endCursor;
    page += 1;
  }

  return collected;
}
