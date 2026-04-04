import { prisma } from "@/lib/db";
import { type GitHubRepository, searchCandidateRepositories } from "@/lib/github";
import {
  createIngestionBatch,
  createIngestionJob,
  createIngestionTask,
  finishIngestionBatch,
  finishIngestionJob,
  finishIngestionTask,
} from "@/lib/ingestion/jobs";
import { syncRepositoryStarHistory } from "@/lib/star-history";

type DiscoveryResult = {
  jobId: number;
  taskId: number;
  batchId: number;
  count: number;
  fetchedAt: Date;
  syncedStarHistory: number;
};

function mapRepositoryData(repo: GitHubRepository, fetchedAt: Date) {
  return {
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    openIssues: repo.open_issues_count,
    topicsJson: JSON.stringify(repo.topics ?? []),
    createdAtGh: new Date(repo.created_at),
    pushedAtGh: repo.pushed_at ? new Date(repo.pushed_at) : null,
    updatedAtGh: repo.updated_at ? new Date(repo.updated_at) : null,
    collectedAt: fetchedAt,
  };
}

export async function discoverRepositories(input?: {
  triggeredBy?: string;
  syncStarHistory?: boolean;
}): Promise<DiscoveryResult> {
  const fetchedAt = new Date();
  const job = await createIngestionJob({
    jobType: "discover_repositories",
    triggeredBy: input?.triggeredBy ?? "system",
    scope: "repositories",
  });
  const task = await createIngestionTask({
    jobId: job.id,
    taskType: "fetch_search_candidates",
  });
  const batch = await createIngestionBatch({
    jobId: job.id,
    taskId: task.id,
    resourceType: "repository_search",
  });

  try {
    const repositories = await searchCandidateRepositories();

    if (repositories.length) {
      await prisma.rawGitHubRepository.createMany({
        data: repositories.map((repo) => ({
          batchId: batch.id,
          resourceKey: repo.full_name,
          githubId: repo.id,
          owner: repo.owner.login,
          name: repo.name,
          payloadJson: JSON.stringify(repo),
          fetchedAt,
        })),
      });
    }

    const normalizedRepositories: Array<{
      id: number;
      owner: string;
      name: string;
      fullName: string;
    }> = [];

    for (const repo of repositories) {
      const repository = await prisma.repository.upsert({
        where: { githubId: repo.id },
        update: mapRepositoryData(repo, fetchedAt),
        create: {
          githubId: repo.id,
          ...mapRepositoryData(repo, fetchedAt),
        },
      });

      await prisma.snapshot.create({
        data: {
          repositoryId: repository.id,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          openIssues: repo.open_issues_count,
          fetchedAt,
        },
      });

      normalizedRepositories.push({
        id: repository.id,
        owner: repository.owner,
        name: repository.name,
        fullName: repository.fullName,
      });
    }

    let syncedStarHistory = 0;

    if (input?.syncStarHistory) {
      for (const repository of normalizedRepositories) {
        try {
          const result = await syncRepositoryStarHistory({
            id: repository.id,
            owner: repository.owner,
            name: repository.name,
          });

          if (result.synced) {
            syncedStarHistory += 1;
          }
        } catch (error) {
          console.warn(`Star history sync failed for ${repository.fullName}:`, error);
        }
      }
    }

    const stats = {
      repositories: repositories.length,
      syncedStarHistory,
      fetchedAt: fetchedAt.toISOString(),
    };

    await finishIngestionBatch(batch.id, {
      status: "success",
      itemCount: repositories.length,
      stats,
    });
    await finishIngestionTask(task.id, {
      status: "success",
      itemCount: repositories.length,
      stats,
    });
    await finishIngestionJob(job.id, {
      status: "success",
      stats,
    });

    return {
      jobId: job.id,
      taskId: task.id,
      batchId: batch.id,
      count: repositories.length,
      fetchedAt,
      syncedStarHistory,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown repository discovery error";

    await finishIngestionBatch(batch.id, {
      status: "failed",
      errorMessage: message,
    });
    await finishIngestionTask(task.id, {
      status: "failed",
      errorMessage: message,
    });
    await finishIngestionJob(job.id, {
      status: "failed",
      errorMessage: message,
    });

    throw error;
  }
}
