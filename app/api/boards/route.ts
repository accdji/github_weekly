import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";
import { getCollectionsIndex } from "@/lib/collections";

export const revalidate = 300;

export async function GET() {
  return jsonWithCache({
    items: await getCollectionsIndex(),
  }, CACHE_WINDOWS.collections);
}
