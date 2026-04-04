export const CACHE_WINDOWS = {
  dashboard: 120,
  manual: 300,
  collections: 300,
  archive: 300,
  jobs: 30,
  repository: 600,
} as const;

function buildCacheControl(seconds: number) {
  return `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`;
}

export function jsonWithCache(data: unknown, seconds: number, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", buildCacheControl(seconds));

  return Response.json(data, {
    ...init,
    headers,
  });
}

export function textWithCache(body: string, seconds: number, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", buildCacheControl(seconds));

  return new Response(body, {
    ...init,
    headers,
  });
}
