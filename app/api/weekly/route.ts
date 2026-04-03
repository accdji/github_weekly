import { prisma } from "@/lib/db";

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
    return Response.json({ weekKey: null, items: [] });
  }

  const items = await prisma.weeklyRanking.findMany({
    where: { weekKey: latestWeek.weekKey },
    orderBy: { rank: "asc" },
    include: { repository: true },
  });

  return Response.json({
    weekKey: latestWeek.weekKey,
    items,
  });
}
