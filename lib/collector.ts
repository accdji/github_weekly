import { prisma } from "@/lib/db";
import { searchCandidateRepositories } from "@/lib/github";
import { syncRepositoryStarHistory } from "@/lib/star-history";

export async function collectDailySnapshots() {
  const repositories = await searchCandidateRepositories();
  const fetchedAt = new Date();

  for (const repo of repositories) {
    const record = await prisma.repository.upsert({
      where: { githubId: repo.id },
      update: {
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
      },
      create: {
        githubId: repo.id,
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
      },
    });

    await prisma.snapshot.create({
      data: {
        repositoryId: record.id,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        fetchedAt,
      },
    });

    try {
      await syncRepositoryStarHistory({
        id: record.id,
        owner: record.owner,
        name: record.name,
      });
    } catch (error) {
      console.warn(`Star history sync failed for ${record.fullName}:`, error);
    }
  }

  return {
    count: repositories.length,
    fetchedAt,
  };
}
