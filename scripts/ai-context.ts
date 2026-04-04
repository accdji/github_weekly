import { prisma } from "@/lib/db";
import { buildAiContext } from "@/lib/ai-toolkit";

async function main() {
  const context = await buildAiContext();
  console.log(JSON.stringify(context, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
