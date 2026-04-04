export function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function safeStringArray(value: string) {
  return parseJsonArray(value).filter((item): item is string => typeof item === "string");
}

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatIsoDay(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}
