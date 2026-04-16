import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";
import { getWeeklyArchive } from "@/lib/archive";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  return jsonWithCache({
    items: await getWeeklyArchive(),
  }, CACHE_WINDOWS.archive);
}
