import { prisma } from "@/lib/db";
import { buildWeeklyRanking } from "@/lib/ranking";

async function main() {
  const result = await buildWeeklyRanking();
  console.log(`Built weekly ranking ${result.weekKey} with ${result.count} rows`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
