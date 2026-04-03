"use client";

import { startTransition, useDeferredValue, useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  DailyHeatmap,
  LanguageDistributionChart,
  SummaryCard,
  TrendComparisonChart,
  formatCompactNumber,
} from "@/components/dashboard-visuals";
import { RepositoryDrawer } from "@/components/repository-drawer";
import type { DashboardItem, DashboardPayload, DashboardRange, RepositoryDetailPayload } from "@/lib/dashboard-types";
import type { Dictionary, Locale } from "@/lib/i18n";

type ViewMode = "table" | "cards";
type SortKey = "rangeStars" | "stars" | "weeklyStars" | "forks" | "updated" | "healthScore";
type SortOrder = "asc" | "desc";
type ScheduleMode = "hourly" | "daily" | "weekly";

type SavedPreferences = {
  range: DashboardRange;
  weekKey: string | null;
  from: string;
  to: string;
  topN: number;
  search: string;
  languages: string[];
  sortKey: SortKey;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  favorites: number[];
  compare: number[];
  read: number[];
  tags: Record<string, string[]>;
  schedule: {
    enabled: boolean;
    mode: ScheduleMode;
    hour: number;
    minute: number;
    weekday: number;
    lastRunAt: string | null;
  };
  subscriptions: {
    keywords: string[];
  };
};

const STORAGE_KEY = "github-weekly-dashboard-preferences";

function toLocalInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function serializeCsv(items: DashboardItem[]) {
  const header = ["fullName", "language", "stars", "weeklyStars", "todayStars", "forks", "rangeStars", "score"];
  const rows = items.map((item) =>
    [
      item.fullName,
      item.language ?? "",
      item.stars,
      item.weeklyStars,
      item.todayStars,
      item.forks,
      item.rangeStars,
      item.score,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}

function serializeMarkdown(items: DashboardItem[], title: string) {
  return [
    `# ${title}`,
    "",
    "| Rank | Repository | Language | Weekly Stars | Range Stars | Total Stars | Forks |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: |",
    ...items.map(
      (item, index) =>
        `| ${index + 1} | ${item.fullName} | ${item.language ?? "-"} | ${item.weeklyStars} | ${item.rangeStars} | ${item.stars} | ${item.forks} |`,
    ),
  ].join("\n");
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function parsePreferences() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SavedPreferences;
  } catch {
    return null;
  }
}

function createDefaultSchedule() {
  return {
    enabled: false,
    mode: "daily" as ScheduleMode,
    hour: 9,
    minute: 0,
    weekday: 1,
    lastRunAt: null as string | null,
  };
}

function createDefaultPreferences(initialData: DashboardPayload): SavedPreferences {
  return {
    range: initialData.range,
    weekKey: initialData.weekKey,
    from: toLocalInputValue(initialData.from),
    to: toLocalInputValue(initialData.to),
    topN: 20,
    search: "",
    languages: [],
    sortKey: "rangeStars",
    sortOrder: "desc",
    viewMode: "table",
    favorites: [],
    compare: [],
    read: [],
    tags: {},
    schedule: createDefaultSchedule(),
    subscriptions: {
      keywords: [],
    },
  };
}

function formatDateTime(value: string | null, locale: Locale) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatDelta(value: number, ready: boolean) {
  return ready ? `+${formatCompactNumber(value)}` : "--";
}

export function DashboardApp({
  locale,
  dictionary,
  initialData,
}: {
  locale: Locale;
  dictionary: Dictionary;
  initialData: DashboardPayload;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<DashboardRange>(initialData.range);
  const [weekKey, setWeekKey] = useState<string | null>(initialData.weekKey ?? initialData.availableWeeks[0] ?? null);
  const [fromDate, setFromDate] = useState(toLocalInputValue(initialData.from));
  const [toDate, setToDate] = useState(toLocalInputValue(initialData.to));
  const [topN, setTopN] = useState(20);
  const [search, setSearch] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("rangeStars");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [schedule, setSchedule] = useState(createDefaultSchedule());
  const [subscriptionInput, setSubscriptionInput] = useState("");
  const [subscriptionKeywords, setSubscriptionKeywords] = useState<string[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [drawerRepo, setDrawerRepo] = useState<DashboardItem | null>(null);
  const [details, setDetails] = useState<Record<string, RepositoryDetailPayload>>({});
  const [hydrated, setHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isPending, startUiTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const itemMap = Object.fromEntries(data.items.map((item) => [item.repositoryId, item]));

  async function copyText(value: string, feedback: string) {
    await navigator.clipboard.writeText(value);
    setNotices((current) => [feedback, ...current].slice(0, 4));
  }

  function buildQueryString(next?: Partial<{ range: DashboardRange; weekKey: string | null; from: string; to: string }>) {
    const params = new URLSearchParams();
    const nextRange = next?.range ?? range;
    const nextWeekKey = next?.weekKey ?? weekKey;
    const nextFrom = next?.from ?? fromDate;
    const nextTo = next?.to ?? toDate;

    params.set("range", nextRange);

    if (nextRange === "snapshot" && nextWeekKey) {
      params.set("weekKey", nextWeekKey);
    }

    if (nextRange === "custom") {
      if (nextFrom) {
        params.set("from", nextFrom);
      }
      if (nextTo) {
        params.set("to", nextTo);
      }
    }

    if (search) {
      params.set("q", search);
    }

    if (selectedLanguages.length) {
      params.set("languages", selectedLanguages.join(","));
    }

    params.set("topN", String(topN));
    params.set("sortKey", sortKey);
    params.set("sortOrder", sortOrder);
    params.set("view", viewMode);

    return params.toString();
  }

  async function loadDashboard(overrides?: Partial<{ range: DashboardRange; weekKey: string | null; from: string; to: string }>) {
    const nextRange = overrides?.range ?? range;
    const nextWeekKey = overrides?.weekKey ?? weekKey;
    const nextFrom = overrides?.from ?? fromDate;
    const nextTo = overrides?.to ?? toDate;
    const params = new URLSearchParams();
    params.set("range", nextRange);

    if (nextRange === "snapshot" && nextWeekKey) {
      params.set("weekKey", nextWeekKey);
    }

    if (nextRange === "custom") {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    }

    const response = await fetch(`/api/dashboard?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load dashboard");
    }

    const payload = (await response.json()) as DashboardPayload;
    startTransition(() => {
      setData(payload);
    });

    return payload;
  }

  async function refreshDashboard() {
    setIsRefreshing(true);

    try {
      const payload = await loadDashboard();
      const normalizedKeywords = subscriptionKeywords.map(normalizeText).filter(Boolean);
      const matches = payload.items.filter((item) => {
        if (!normalizedKeywords.length) {
          return false;
        }
        const text = `${item.fullName} ${item.description ?? ""} ${item.owner}`.toLowerCase();
        return normalizedKeywords.some((keyword) => text.includes(keyword));
      });

      if (matches.length) {
        const messages = matches.slice(0, 2).map((item) => `${item.fullName} matched your subscriptions.`);
        setNotices((current) => [...messages, ...current].slice(0, 4));

        if ("Notification" in window && Notification.permission === "granted") {
          for (const message of messages) {
            new Notification("GitHub Weekly", { body: message });
          }
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function triggerCollection(manual = true) {
    setIsCollecting(true);

    try {
      const response = await fetch("/api/jobs/collect", { method: "POST" });

      if (!response.ok) {
        throw new Error("Failed to trigger collection");
      }

      const payload = (await response.json()) as { dashboard: DashboardPayload };
      startTransition(() => {
        setData(payload.dashboard);
      });

      if (manual) {
        setNotices((current) => [`${dictionary.actions.trigger} OK`, ...current].slice(0, 4));
      }

      if (subscriptionKeywords.length) {
        const matches = payload.dashboard.items.filter((item) => {
          const text = `${item.fullName} ${item.description ?? ""} ${item.owner}`.toLowerCase();
          return subscriptionKeywords.map(normalizeText).some((keyword) => text.includes(keyword));
        });

        if (matches.length) {
          setNotices((current) => [...matches.slice(0, 2).map((item) => `${item.fullName} matched your subscriptions.`), ...current].slice(0, 4));
        }
      }
    } finally {
      setIsCollecting(false);
    }
  }

  async function ensureDetail(item: DashboardItem) {
    if (details[item.fullName]) {
      return details[item.fullName];
    }

    const response = await fetch(`/api/repositories/${item.owner}/${item.name}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load repository detail");
    }

    const payload = (await response.json()) as RepositoryDetailPayload;
    startUiTransition(() => {
      setDetails((current) => ({
        ...current,
        [item.fullName]: payload,
      }));
    });

    return payload;
  }

  useEffect(() => {
    const saved = parsePreferences();
    const defaults = createDefaultPreferences(initialData);
    const params = new URLSearchParams(searchParams.toString());
    const next = saved ?? defaults;

    setRange((params.get("range") as DashboardRange) || next.range);
    setWeekKey(params.get("weekKey") ?? next.weekKey);
    setFromDate(params.get("from") ?? next.from);
    setToDate(params.get("to") ?? next.to);
    setSearch(params.get("q") ?? next.search);
    setSelectedLanguages(params.get("languages") ? params.get("languages")!.split(",").filter(Boolean) : next.languages);
    setTopN(Number(params.get("topN") ?? next.topN));
    setSortKey((params.get("sortKey") as SortKey) || next.sortKey);
    setSortOrder((params.get("sortOrder") as SortOrder) || next.sortOrder);
    setViewMode((params.get("view") as ViewMode) || next.viewMode);
    setFavorites(next.favorites);
    setCompareIds(next.compare);
    setReadIds(next.read);
    setTags(next.tags);
    setSchedule(next.schedule);
    setSubscriptionKeywords(next.subscriptions.keywords);
    setHydrated(true);
  }, [initialData, searchParams]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const preferences: SavedPreferences = {
      range,
      weekKey,
      from: fromDate,
      to: toDate,
      topN,
      search,
      languages: selectedLanguages,
      sortKey,
      sortOrder,
      viewMode,
      favorites,
      compare: compareIds,
      read: readIds,
      tags,
      schedule,
      subscriptions: {
        keywords: subscriptionKeywords,
      },
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    const query = buildQueryString();
    const nextHref = `${pathname}${query ? `?${query}` : ""}`;
    const currentHref = `${window.location.pathname}${window.location.search}`;

    if (nextHref !== currentHref) {
      window.history.replaceState(null, "", nextHref);
    }
  }, [
    compareIds,
    favorites,
    fromDate,
    hydrated,
    pathname,
    range,
    readIds,
    schedule,
    search,
    selectedLanguages,
    sortKey,
    sortOrder,
    subscriptionKeywords,
    tags,
    toDate,
    topN,
    viewMode,
    weekKey,
  ]);

  useEffect(() => {
    if (!hydrated || !schedule.enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        const now = new Date();
        const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
        const sameMinute = now.getMinutes() === schedule.minute;
        const sameHour = now.getHours() === schedule.hour;
        const sameWeekday = now.getDay() === schedule.weekday;
        const alreadyRanThisWindow =
          lastRun &&
          lastRun.getUTCFullYear() === now.getUTCFullYear() &&
          lastRun.getUTCMonth() === now.getUTCMonth() &&
          lastRun.getUTCDate() === now.getUTCDate() &&
          lastRun.getUTCHours() === now.getUTCHours() &&
          lastRun.getUTCMinutes() === now.getUTCMinutes();

        if (alreadyRanThisWindow) {
          return;
        }

        const shouldRun =
          (schedule.mode === "hourly" && sameMinute) ||
          (schedule.mode === "daily" && sameHour && sameMinute) ||
          (schedule.mode === "weekly" && sameWeekday && sameHour && sameMinute);

        if (!shouldRun) {
          return;
        }

        await triggerCollection(false);
        setSchedule((current) => ({
          ...current,
          lastRunAt: new Date().toISOString(),
        }));
      })();
    }, 60000);
    void (async () => {
      const now = new Date();
      const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
      const sameMinute = now.getMinutes() === schedule.minute;
      const sameHour = now.getHours() === schedule.hour;
      const sameWeekday = now.getDay() === schedule.weekday;
      const alreadyRanThisWindow =
        lastRun &&
        lastRun.getUTCFullYear() === now.getUTCFullYear() &&
        lastRun.getUTCMonth() === now.getUTCMonth() &&
        lastRun.getUTCDate() === now.getUTCDate() &&
        lastRun.getUTCHours() === now.getUTCHours() &&
        lastRun.getUTCMinutes() === now.getUTCMinutes();

      if (alreadyRanThisWindow) {
        return;
      }

      const shouldRun =
        (schedule.mode === "hourly" && sameMinute) ||
        (schedule.mode === "daily" && sameHour && sameMinute) ||
        (schedule.mode === "weekly" && sameWeekday && sameHour && sameMinute);

      if (!shouldRun) {
        return;
      }

      await triggerCollection(false);
      setSchedule((current) => ({
        ...current,
        lastRunAt: new Date().toISOString(),
      }));
    })();

    return () => window.clearInterval(timer);
  }, [hydrated, schedule, subscriptionKeywords]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void loadDashboard({
      range,
      weekKey,
      from: fromDate,
      to: toDate,
    });
  }, [fromDate, hydrated, range, toDate, weekKey]);

  const filteredItems = data.items
    .filter((item) => {
      if (selectedLanguages.length && (!item.language || !selectedLanguages.includes(item.language))) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const text = `${item.fullName} ${item.description ?? ""} ${item.owner}`.toLowerCase();
      return text.includes(deferredSearch.toLowerCase());
    })
    .sort((left, right) => {
      const updatedLeft = left.lastPushedAt ? new Date(left.lastPushedAt).getTime() : 0;
      const updatedRight = right.lastPushedAt ? new Date(right.lastPushedAt).getTime() : 0;
      const leftValue =
        sortKey === "updated"
          ? updatedLeft
          : sortKey === "healthScore"
            ? left.healthScore
            : left[sortKey];
      const rightValue =
        sortKey === "updated"
          ? updatedRight
          : sortKey === "healthScore"
            ? right.healthScore
            : right[sortKey];
      const direction = sortOrder === "asc" ? 1 : -1;
      return leftValue > rightValue ? direction : leftValue < rightValue ? -direction : 0;
    })
    .slice(0, topN);

  const favoritesItems = favorites.map((id) => itemMap[id]).filter((item): item is DashboardItem => Boolean(item));
  const compareDetails = compareIds
    .map((id) => itemMap[id])
    .filter((item): item is DashboardItem => Boolean(item))
    .map((item) => details[item.fullName])
    .filter((item): item is RepositoryDetailPayload => Boolean(item));
  const selectedCount = selectedIds.length;
  const summaryItems = [
    { label: dictionary.summary.totalProjects, value: String(filteredItems.length), accent: "sand" },
    {
      label: dictionary.summary.totalRangeStars,
      value: filteredItems.some((item) => item.rangeHistoryReady)
        ? formatCompactNumber(filteredItems.reduce((sum, item) => sum + (item.rangeHistoryReady ? item.rangeStars : 0), 0))
        : "--",
      accent: "ember",
    },
    {
      label: dictionary.summary.totalWeeklyStars,
      value: filteredItems.some((item) => item.weeklyHistoryReady)
        ? formatCompactNumber(filteredItems.reduce((sum, item) => sum + (item.weeklyHistoryReady ? item.weeklyStars : 0), 0))
        : "--",
      accent: "jade",
    },
    { label: dictionary.summary.topLanguage, value: data.summary.topLanguage, accent: "ink" },
  ] as const;
  const heroSignals = [
    { label: dictionary.filters.timeRange, value: data.rangeLabel },
    { label: dictionary.sections.compare, value: `${compareIds.length}/5` },
    { label: dictionary.sections.favorites, value: String(favorites.length) },
    { label: dictionary.sections.autoSchedule, value: schedule.enabled ? dictionary.misc.yes : dictionary.misc.no },
  ] as const;

  return (
    <>
      <main className="magazine-shell">
        <section className="masthead">
          <div className="masthead__mesh" />
          <div className="masthead__grid" />
          <div className="masthead__nav">
            <div>
              <div className="brand-mark">{dictionary.nav.title}</div>
              <p className="brand-note">{dictionary.nav.subtitle}</p>
            </div>
            <LanguageSwitcher locale={locale} />
          </div>
          <div className="masthead__body">
            <div className="masthead__copy">
              <p className="eyebrow">{dictionary.hero.kicker}</p>
              <h1 className="headline">{dictionary.hero.title}</h1>
              <p className="lead">{dictionary.hero.description}</p>
              <div className="hero-chip-row">
                {heroSignals.map((item) => (
                  <div key={item.label} className="hero-chip">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="action-row">
                <button className="primary-button" type="button" onClick={() => void triggerCollection()} disabled={isCollecting}>
                  {isCollecting ? dictionary.actions.triggering : dictionary.actions.trigger}
                </button>
                <button className="secondary-button" type="button" onClick={() => void refreshDashboard()} disabled={isRefreshing}>
                  {isRefreshing ? dictionary.actions.refreshing : dictionary.actions.refresh}
                </button>
                <button className="secondary-button" type="button" onClick={() => downloadFile("github-weekly.csv", serializeCsv(filteredItems), "text/csv")}>
                  {dictionary.actions.exportCsv}
                </button>
                <button className="secondary-button" type="button" onClick={() => downloadFile("github-weekly.json", JSON.stringify(filteredItems, null, 2), "application/json")}>
                  {dictionary.actions.exportJson}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => downloadFile("github-weekly-report.md", serializeMarkdown(filteredItems, dictionary.nav.title), "text/markdown")}
                >
                  {dictionary.actions.exportReport}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void copyText(window.location.href, dictionary.misc.shareReady)}
                >
                  {dictionary.actions.share}
                </button>
              </div>
            </div>
            <div className="summary-grid">
              <article className="signal-panel">
                <div className="signal-panel__top">
                  <span className="signal-panel__title">SYS / LIVE</span>
                  <span className="signal-panel__dot" />
                </div>
                <div className="signal-panel__grid">
                  <div className="signal-panel__item">
                    <span>{dictionary.summary.lastFetchedAt}</span>
                    <strong>{formatDateTime(data.lastFetchedAt, locale)}</strong>
                  </div>
                  <div className="signal-panel__item">
                    <span>{dictionary.summary.freshestProject}</span>
                    <strong>{data.summary.freshestProject ?? "--"}</strong>
                  </div>
                  <div className="signal-panel__item">
                    <span>{dictionary.summary.totalForks}</span>
                    <strong>{formatCompactNumber(data.summary.totalForks)}</strong>
                  </div>
                  <div className="signal-panel__item">
                    <span>{dictionary.summary.totalStars}</span>
                    <strong>{formatCompactNumber(data.summary.totalStars)}</strong>
                  </div>
                </div>
                <div className="signal-panel__footer">
                  <span>pipeline / github-search / ranking / bilingual-ui</span>
                </div>
              </article>
              {summaryItems.map((item) => (
                <SummaryCard key={item.label} label={item.label} value={item.value} accent={item.accent} />
              ))}
            </div>
          </div>
        </section>

        {notices.length ? (
          <section className="notice-strip">
            {notices.map((notice, index) => (
              <span key={`${notice}-${index}`}>{notice}</span>
            ))}
          </section>
        ) : null}

        {!filteredItems.some((item) => item.weeklyHistoryReady) ? (
          <section className="notice-strip">
            <span>{dictionary.misc.historyPending}</span>
          </section>
        ) : null}

        <section className="control-room">
          <div className="control-room__header">
            <p className="eyebrow">{dictionary.sections.controlRoom}</p>
            <div className="view-toggle">
              <button
                type="button"
                className={`pill-button${viewMode === "table" ? " is-active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                {dictionary.actions.viewTable}
              </button>
              <button
                type="button"
                className={`pill-button${viewMode === "cards" ? " is-active" : ""}`}
                onClick={() => setViewMode("cards")}
              >
                {dictionary.actions.viewCards}
              </button>
            </div>
          </div>
          <div className="filters-grid">
            <label className="field">
              <span>{dictionary.filters.timeRange}</span>
              <select value={range} onChange={(event) => setRange(event.target.value as DashboardRange)}>
                {Object.entries(dictionary.filters.rangeOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {range === "snapshot" ? (
              <label className="field">
                <span>{dictionary.filters.archiveWeek}</span>
                <select value={weekKey ?? ""} onChange={(event) => setWeekKey(event.target.value || null)}>
                  {data.availableWeeks.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {range === "custom" ? (
              <>
                <label className="field">
                  <span>{dictionary.filters.from}</span>
                  <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                </label>
                <label className="field">
                  <span>{dictionary.filters.to}</span>
                  <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                </label>
              </>
            ) : null}

            <label className="field field--search">
              <span>{dictionary.filters.search}</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={dictionary.filters.search} />
            </label>

            <label className="field">
              <span>{dictionary.filters.topN}</span>
              <select value={topN} onChange={(event) => setTopN(Number(event.target.value))}>
                {[10, 20, 50, 100].map((count) => (
                  <option key={count} value={count}>
                    Top {count}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{dictionary.filters.sortBy}</span>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                {Object.entries(dictionary.sortOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{dictionary.filters.sortOrder}</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
                <option value="desc">{dictionary.filters.descending}</option>
                <option value="asc">{dictionary.filters.ascending}</option>
              </select>
            </label>
          </div>

          <div className="chip-row">
            <button
              type="button"
              className={`filter-chip${selectedLanguages.length === 0 ? " is-active" : ""}`}
              onClick={() => setSelectedLanguages([])}
            >
              {dictionary.filters.allLanguages}
            </button>
            {data.availableLanguages.map((language) => (
              <button
                key={language}
                type="button"
                className={`filter-chip${selectedLanguages.includes(language) ? " is-active" : ""}`}
                onClick={() =>
                  setSelectedLanguages((current) =>
                    current.includes(language) ? current.filter((item) => item !== language) : [...current, language],
                  )
                }
              >
                {language}
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-grid__main">
            <section className="deck">
              <div className="deck__header">
                <div>
                  <p className="eyebrow">{dictionary.sections.rankings}</p>
                  <h2>{data.rangeLabel}</h2>
                </div>
                {selectedCount ? (
                  <div className="bulk-actions">
                    <span>
                      {selectedCount} {dictionary.table.selected}
                    </span>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setFavorites((current) => Array.from(new Set([...current, ...selectedIds])))}
                    >
                      {dictionary.actions.batchFavorite}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => downloadFile("github-weekly-selected.csv", serializeCsv(filteredItems.filter((item) => selectedIds.includes(item.repositoryId))), "text/csv")}
                    >
                      {dictionary.actions.batchExport}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setReadIds((current) => Array.from(new Set([...current, ...selectedIds])))}
                    >
                      {dictionary.actions.batchRead}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => setSelectedIds([])}>
                      {dictionary.actions.clearSelection}
                    </button>
                  </div>
                ) : null}
              </div>

              {viewMode === "table" ? (
                <div className="table-shell">
                  <table className="editorial-table">
                    <thead>
                      <tr>
                        <th>{dictionary.table.columns.select}</th>
                        <th>{dictionary.table.columns.rank}</th>
                        <th>{dictionary.table.columns.repository}</th>
                        <th>{dictionary.table.columns.language}</th>
                        <th>{dictionary.table.columns.weeklyStars}</th>
                        <th>{dictionary.table.columns.todayStars}</th>
                        <th>{dictionary.table.columns.totalStars}</th>
                        <th>{dictionary.table.columns.forks}</th>
                        <th>{dictionary.table.columns.health}</th>
                        <th>{dictionary.table.columns.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length ? (
                        filteredItems.map((item, index) => (
                          <tr key={item.repositoryId} className={readIds.includes(item.repositoryId) ? "is-muted" : ""}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.repositoryId)}
                                onChange={() =>
                                  setSelectedIds((current) =>
                                    current.includes(item.repositoryId)
                                      ? current.filter((id) => id !== item.repositoryId)
                                      : [...current, item.repositoryId],
                                  )
                                }
                              />
                            </td>
                            <td>#{index + 1}</td>
                            <td>
                              <button
                                type="button"
                                className="repo-link"
                                onClick={() => {
                                  setDrawerRepo(item);
                                  void ensureDetail(item);
                                }}
                              >
                                {item.fullName}
                              </button>
                              {item.description ? <p className="repo-copy">{item.description}</p> : null}
                              <div className="inline-chips">
                                {item.topics.slice(0, 3).map((topic) => (
                                  <span key={topic} className="mini-chip">
                                    {topic}
                                  </span>
                                ))}
                                {(tags[item.repositoryId] ?? []).map((tag) => (
                                  <span key={`${item.repositoryId}-${tag}`} className="mini-chip mini-chip--accent">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>{item.language ?? "--"}</td>
                            <td>{formatDelta(item.weeklyStars, item.weeklyHistoryReady)}</td>
                            <td>{formatDelta(item.todayStars, item.todayHistoryReady)}</td>
                            <td>{formatCompactNumber(item.stars)}</td>
                            <td>{formatCompactNumber(item.forks)}</td>
                            <td>{item.healthScore}</td>
                            <td>
                              <div className="row-actions">
                                <button type="button" className="icon-button" onClick={() => window.open(item.htmlUrl, "_blank", "noreferrer")}>
                                  {dictionary.actions.openGithub}
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() =>
                                    void copyText(
                                      `${item.fullName}\n${item.cloneUrl}\n${item.description ?? ""}`,
                                      `${item.fullName} ${dictionary.actions.copied}`,
                                    )
                                  }
                                >
                                  {dictionary.actions.copyRepo}
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() =>
                                    setFavorites((current) =>
                                      current.includes(item.repositoryId)
                                        ? current.filter((id) => id !== item.repositoryId)
                                        : [...current, item.repositoryId],
                                    )
                                  }
                                >
                                  {favorites.includes(item.repositoryId) ? dictionary.actions.unfavorite : dictionary.actions.favorite}
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() =>
                                    setCompareIds((current) => {
                                      if (current.includes(item.repositoryId)) {
                                        return current.filter((id) => id !== item.repositoryId);
                                      }
                                      return current.length >= 5 ? current : [...current, item.repositoryId];
                                    })
                                  }
                                >
                                  {compareIds.includes(item.repositoryId) ? dictionary.actions.compared : dictionary.actions.compare}
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() =>
                                    setTags((current) => {
                                      const nextTag = window.prompt(dictionary.actions.tag, current[item.repositoryId]?.join(", ") ?? "");
                                      if (nextTag === null) {
                                        return current;
                                      }
                                      return {
                                        ...current,
                                        [item.repositoryId]: mergeUnique(nextTag.split(",")),
                                      };
                                    })
                                  }
                                >
                                  {dictionary.actions.tag}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="empty-state">
                            {dictionary.table.empty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-grid">
                  {filteredItems.map((item, index) => (
                    <article key={item.repositoryId} className="project-card">
                      <div className="project-card__top">
                        <span>#{index + 1}</span>
                        <span>{item.language ?? "--"}</span>
                      </div>
                      <button
                        type="button"
                        className="repo-link"
                        onClick={() => {
                          setDrawerRepo(item);
                          void ensureDetail(item);
                        }}
                      >
                        {item.fullName}
                      </button>
                      <p>{item.description ?? "--"}</p>
                      <div className="project-card__metrics">
                        <div>
                          <span>{dictionary.table.columns.weeklyStars}</span>
                      <strong>{formatDelta(item.weeklyStars, item.weeklyHistoryReady)}</strong>
                        </div>
                        <div>
                          <span>{dictionary.table.columns.todayStars}</span>
                      <strong>{formatDelta(item.todayStars, item.todayHistoryReady)}</strong>
                        </div>
                        <div>
                          <span>{dictionary.table.columns.totalStars}</span>
                          <strong>{formatCompactNumber(item.stars)}</strong>
                        </div>
                        <div>
                          <span>{dictionary.table.columns.forks}</span>
                          <strong>{formatCompactNumber(item.forks)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="signals-grid">
              <LanguageDistributionChart items={filteredItems} title={dictionary.charts.languageDistribution} />
              <TrendComparisonChart details={compareDetails} title={dictionary.charts.starTrend} emptyLabel={dictionary.charts.empty} />
              <DailyHeatmap cells={data.heatmap} title={dictionary.charts.dailyHeatmap} />
            </section>
          </div>
          <aside className="dashboard-grid__rail">
            <section className="rail-card">
              <p className="eyebrow">{dictionary.sections.autoSchedule}</p>
              <h3>{dictionary.sections.autoSchedule}</h3>
              <p>{dictionary.schedule.description}</p>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(event) => setSchedule((current) => ({ ...current, enabled: event.target.checked }))}
                />
                <span>{dictionary.schedule.enabled}</span>
              </label>
              <div className="rail-form">
                <label className="field">
                  <span>{dictionary.schedule.mode}</span>
                  <select value={schedule.mode} onChange={(event) => setSchedule((current) => ({ ...current, mode: event.target.value as ScheduleMode }))}>
                    <option value="hourly">{dictionary.schedule.hourly}</option>
                    <option value="daily">{dictionary.schedule.daily}</option>
                    <option value="weekly">{dictionary.schedule.weekly}</option>
                  </select>
                </label>
                {schedule.mode !== "hourly" ? (
                  <label className="field">
                    <span>{dictionary.schedule.hour}</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={schedule.hour}
                      onChange={(event) => setSchedule((current) => ({ ...current, hour: Number(event.target.value) }))}
                    />
                  </label>
                ) : null}
                <label className="field">
                  <span>{dictionary.schedule.minute}</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={schedule.minute}
                    onChange={(event) => setSchedule((current) => ({ ...current, minute: Number(event.target.value) }))}
                  />
                </label>
                {schedule.mode === "weekly" ? (
                  <label className="field">
                    <span>{dictionary.schedule.weekday}</span>
                    <select value={schedule.weekday} onChange={(event) => setSchedule((current) => ({ ...current, weekday: Number(event.target.value) }))}>
                      {dictionary.schedule.weekdays.map((label, index) => (
                        <option key={label} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <button
                type="button"
                className="secondary-button secondary-button--full"
                onClick={() => setNotices((current) => [dictionary.misc.scheduleSaved, ...current].slice(0, 4))}
              >
                {dictionary.actions.savePreferences}
              </button>
            </section>

            <section className="rail-card">
              <p className="eyebrow">{dictionary.sections.subscriptions}</p>
              <h3>{dictionary.sections.subscriptions}</h3>
              <p>{dictionary.subscriptions.description}</p>
              <label className="field">
                <span>{dictionary.subscriptions.keywords}</span>
                <div className="inline-form">
                  <input value={subscriptionInput} onChange={(event) => setSubscriptionInput(event.target.value)} placeholder="ai, rust, agent" />
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setSubscriptionKeywords((current) => mergeUnique([...current, ...subscriptionInput.split(",")]));
                      setSubscriptionInput("");
                    }}
                  >
                    {dictionary.actions.add}
                  </button>
                </div>
              </label>
              <div className="inline-chips">
                {subscriptionKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    className="mini-chip mini-chip--accent"
                    onClick={() => setSubscriptionKeywords((current) => current.filter((item) => item !== keyword))}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="secondary-button secondary-button--full"
                onClick={async () => {
                  if ("Notification" in window) {
                    await Notification.requestPermission();
                    setNotices((current) => [dictionary.misc.notificationsEnabled, ...current].slice(0, 4));
                  }
                }}
              >
                {dictionary.subscriptions.notifications}
              </button>
            </section>

            <section className="rail-card">
              <p className="eyebrow">{dictionary.sections.favorites}</p>
              <h3>{dictionary.sections.favorites}</h3>
              <div className="favorites-list">
                {favoritesItems.length ? (
                  favoritesItems.map((item) => (
                    <button
                      key={item.repositoryId}
                      type="button"
                      className="favorites-list__item"
                      onClick={() => {
                        setDrawerRepo(item);
                        void ensureDetail(item);
                      }}
                    >
                      <span>{item.fullName}</span>
                      <strong>{item.rangeHistoryReady ? `+${item.rangeStars}` : "--"}</strong>
                    </button>
                  ))
                ) : (
                  <p className="muted">{dictionary.misc.favoritesEmpty}</p>
                )}
              </div>
            </section>

            <section className="rail-card">
              <p className="eyebrow">{dictionary.sections.compare}</p>
              <h3>{dictionary.sections.compare}</h3>
              <p>{dictionary.charts.compareHint}</p>
              <div className="favorites-list">
                {compareIds.map((id) => itemMap[id]).filter(Boolean).map((item) => (
                  <div key={item!.repositoryId} className="favorites-list__item">
                    <span>{item!.fullName}</span>
                    <button type="button" className="icon-button" onClick={() => setCompareIds((current) => current.filter((value) => value !== item!.repositoryId))}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>

      <RepositoryDrawer
        detail={drawerRepo ? details[drawerRepo.fullName] ?? null : null}
        dictionary={dictionary}
        onClose={() => setDrawerRepo(null)}
      />

      {isPending ? <div className="pending-indicator" /> : null}
    </>
  );
}
