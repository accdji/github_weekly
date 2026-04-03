import { prisma } from "@/lib/db";
import { syncRepositoryStarHistory } from "@/lib/star-history";

async function main() {
  const repositories = await prisma.repository.findMany({
    orderBy: {
      stars: "desc",
    },
  });

  let synced = 0;

  for (const repository of repositories) {
    const result = await syncRepositoryStarHistory({
      id: repository.id,
      owner: repository.owner,
      name: repository.name,
    });

    if (result.synced) {
      synced += 1;
      console.log(`Synced star history for ${repository.fullName}`);
    } else {
      console.log(`Skipped ${repository.fullName}: ${result.reason}`);
      break;
    }
  }

  console.log(`Star history sync finished. Synced ${synced} repositories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
