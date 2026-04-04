import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";
import { getCollectionDetail } from "@/lib/collections";

export const revalidate = 300;

type Context = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  const params = await context.params;
  const payload = await getCollectionDetail(params.slug);

  if (!payload) {
    return new Response("Not found", { status: 404 });
  }

  return jsonWithCache(payload, CACHE_WINDOWS.collections);
}
