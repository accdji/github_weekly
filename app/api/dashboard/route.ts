import { getDashboardData } from "@/lib/dashboard";
import type { DashboardRange } from "@/lib/dashboard-types";
import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";

export const revalidate = 120;

function parseRange(value: string | null): DashboardRange {
  if (value === "today" || value === "week" || value === "month" || value === "custom" || value === "snapshot") {
    return value;
  }

  return "week";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = parseRange(url.searchParams.get("range"));
  const weekKey = url.searchParams.get("weekKey");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const payload = await getDashboardData({
    range,
    weekKey,
    from,
    to,
  });

  return jsonWithCache(payload, CACHE_WINDOWS.dashboard);
}
