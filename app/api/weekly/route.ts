import { prisma } from "@/lib/db";
import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const weekKey = url.searchParams.get("week");
  const latestWeek = weekKey
    ? { weekKey }
    : await prisma.weeklyRanking.findFirst({
        orderBy: [{ weekKey: "desc" }, { rank: "asc" }],
        select: { weekKey: true },
      });

  if (!latestWeek) {
    return jsonWithCache({ weekKey: null, items: [] }, CACHE_WINDOWS.archive);
  }

  const items = await prisma.weeklyRanking.findMany({
    where: { weekKey: latestWeek.weekKey },
    orderBy: { rank: "asc" },
    include: { repository: true },
  });

  return jsonWithCache({
    weekKey: latestWeek.weekKey,
    items,
  }, CACHE_WINDOWS.archive);
}
