import { prisma } from "@/lib/db";
import { buildAiReport } from "@/lib/ai-toolkit";

async function main() {
  const report = await buildAiReport();
  console.log(report);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
