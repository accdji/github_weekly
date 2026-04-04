import { prisma } from "@/lib/db";
import { buildRepositoryDossier } from "@/lib/ai-toolkit";

async function main() {
  const fullName = process.argv[2];

  if (!fullName) {
    throw new Error("Usage: npm run ai:repo -- owner/name");
  }

  const dossier = await buildRepositoryDossier(fullName);

  if (!dossier) {
    throw new Error(`Repository not found: ${fullName}`);
  }

  console.log(JSON.stringify(dossier, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
