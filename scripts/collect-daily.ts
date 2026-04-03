import { collectDailySnapshots } from "@/lib/collector";
import { prisma } from "@/lib/db";

async function main() {
  const result = await collectDailySnapshots();
  console.log(`Collected ${result.count} repositories at ${result.fetchedAt.toISOString()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
