import { buildAiContext } from "@/lib/ai-toolkit";
import { CACHE_WINDOWS, jsonWithCache } from "@/lib/http-cache";

export const revalidate = 300;

export async function GET() {
  return jsonWithCache(await buildAiContext(), CACHE_WINDOWS.manual);
}
