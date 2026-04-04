import { prisma } from "@/lib/db";
import { syncSeedCollections } from "@/lib/collections";

async function main() {
  const result = await syncSeedCollections();
  console.log(JSON.stringify({ status: "success", ...result }, null, 2));
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
