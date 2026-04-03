import { collectDailySnapshots } from "@/lib/collector";
import { getDashboardData } from "@/lib/dashboard";
import { buildWeeklyRanking } from "@/lib/ranking";

export async function POST() {
  const collected = await collectDailySnapshots();
  const ranking = await buildWeeklyRanking();
  const payload = await getDashboardData({ range: "week" });

  return Response.json({
    collected: {
      count: collected.count,
      fetchedAt: collected.fetchedAt.toISOString(),
    },
    ranking,
    dashboard: payload,
  });
}
