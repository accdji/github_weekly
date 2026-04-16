import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";
import { getCollectionDetail } from "@/lib/collections";

export const revalidate = 300;

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  const params = await context.params;
  const yearValue = new URL(request.url).searchParams.get("year");
  const payload = await getCollectionDetail(params.slug, yearValue ? Number(yearValue) : undefined);

  if (!payload) {
    return new Response("Not found", { status: 404 });
  }

  return jsonWithCache(payload, CACHE_WINDOWS.collections);
}
