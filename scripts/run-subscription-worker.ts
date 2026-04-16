import { prisma } from "@/lib/db";
import { runSubscriptionWorker } from "@/lib/workers";

async function main() {
  const frequency = process.argv.includes("--monthly") ? "monthly" : "weekly";
  const result = await runSubscriptionWorker({
    triggeredBy: process.env.JOB_TRIGGERED_BY ?? "cli-worker",
    frequency,
  });

  console.log(JSON.stringify({ status: "success", frequency, ...result }, null, 2));
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
