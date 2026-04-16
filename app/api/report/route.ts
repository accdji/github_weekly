import { buildAiReport } from "@/lib/ai-toolkit";
import { CACHE_WINDOWS, textWithCache } from "@/lib/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const markdown = await buildAiReport();

  return textWithCache(markdown, CACHE_WINDOWS.manual, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
