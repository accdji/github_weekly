export const locales = ["en", "zh-CN"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-CN";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const productName = {
  en: "Open Source Trend Intelligence Desk",
  "zh-CN": "开源趋势情报台",
} as const;

export type Dictionary = {
  nav: {
    title: string;
    subtitle: string;
    languageLabel: string;
    locales: Record<Locale, string>;
    links: {
      dashboard: string;
      archive: string;
      boards: string;
      subscriptions: string;
      methodology: string;
      jobs: string;
      ai: string;
    };
  };
  hero: {
    kicker: string;
    title: string;
    description: string;
  };
  actions: {
    trigger: string;
    triggering: string;
    refresh: string;
    refreshing: string;
    exportCsv: string;
    exportJson: string;
    exportReport: string;
    share: string;
    copied: string;
    viewTable: string;
    viewCards: string;
    batchFavorite: string;
    batchExport: string;
    batchRead: string;
    clearSelection: string;
    openGithub: string;
    copyRepo: string;
    favorite: string;
    unfavorite: string;
    compare: string;
    compared: string;
    markRead: string;
    read: string;
    add: string;
    tag: string;
    close: string;
    savePreferences: string;
  };
  filters: {
    timeRange: string;
    rangeOptions: Record<"today" | "week" | "month" | "custom" | "snapshot", string>;
    archiveWeek: string;
    from: string;
    to: string;
    topN: string;
    search: string;
    language: string;
    allLanguages: string;
    sortBy: string;
    sortOrder: string;
    ascending: string;
    descending: string;
    viewMode: string;
  };
  summary: {
    totalProjects: string;
    totalRangeStars: string;
    totalWeeklyStars: string;
    totalStars: string;
    totalForks: string;
    topLanguage: string;
    freshestProject: string;
    lastFetchedAt: string;
  };
  sections: {
    controlRoom: string;
    rankings: string;
    charts: string;
    compare: string;
    autoSchedule: string;
    subscriptions: string;
    favorites: string;
    detail: string;
    history: string;
    health: string;
    recommendations: string;
    methodology: string;
    archive: string;
    boards: string;
    jobs: string;
    aiToolkit: string;
  };
  schedule: {
    description: string;
    enabled: string;
    mode: string;
    hourly: string;
    daily: string;
    weekly: string;
    hour: string;
    minute: string;
    weekday: string;
    weekdays: string[];
  };
  subscriptions: {
    description: string;
    keywords: string;
    watchedProjects: string;
    notifications: string;
  };
  charts: {
    languageDistribution: string;
    starTrend: string;
    dailyHeatmap: string;
    compareHint: string;
    empty: string;
  };
  table: {
    empty: string;
    selected: string;
    columns: {
      select: string;
      rank: string;
      repository: string;
      language: string;
      totalStars: string;
      weeklyStars: string;
      todayStars: string;
      forks: string;
      health: string;
      actions: string;
    };
  };
  sortOptions: Record<"rangeStars" | "stars" | "weeklyStars" | "forks" | "updated" | "healthScore", string>;
  detail: {
    description: string;
    contributors: string;
    readme: string;
    clone: string;
    issueResponse: string;
    mergeRate: string;
    recentPush: string;
    noReadme: string;
  };
  pages: {
    methodology: {
      title: string;
      intro: string;
    };
    archive: {
      title: string;
      intro: string;
    };
    boards: {
      title: string;
      intro: string;
    };
    jobs: {
      title: string;
      intro: string;
    };
    subscriptions: {
      title: string;
      intro: string;
    };
    ai: {
      title: string;
      intro: string;
    };
  };
  misc: {
    favoritesEmpty: string;
    yes: string;
    no: string;
    noDetail: string;
    shareReady: string;
    scheduleSaved: string;
    notificationsEnabled: string;
    historyPending: string;
    noData: string;
    generatedAt: string;
    status: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      title: productName.en,
      subtitle: "Open-source momentum intelligence for builders, analysts, and content teams",
      languageLabel: "Language",
      locales: { en: "English", "zh-CN": "中文" },
      links: {
        dashboard: "Dashboard",
        archive: "Archive",
        boards: "Collections",
        subscriptions: "Subscriptions",
        methodology: "Methodology",
        jobs: "Job Center",
        ai: "Product Manual",
      },
    },
    hero: {
      kicker: "Signal-first product view",
      title: "See the fastest-rising GitHub repositories of the week in one place.",
      description:
        "A bilingual intelligence desk for weekly open-source momentum, with historical archives, curated collections, backend job tracking, and AI-ready tooling.",
    },
    actions: {
      trigger: "Run collection",
      triggering: "Collecting...",
      refresh: "Refresh data",
      refreshing: "Refreshing...",
      exportCsv: "Export CSV",
      exportJson: "Export JSON",
      exportReport: "Generate report",
      share: "Share snapshot",
      copied: "Copied",
      viewTable: "Table",
      viewCards: "Cards",
      batchFavorite: "Favorite selected",
      batchExport: "Export selected",
      batchRead: "Mark selected read",
      clearSelection: "Clear",
      openGithub: "GitHub",
      copyRepo: "Copy info",
      favorite: "Favorite",
      unfavorite: "Unfavorite",
      compare: "Compare",
      compared: "Compared",
      markRead: "Mark read",
      read: "Read",
      add: "Add",
      tag: "Tag",
      close: "Close",
      savePreferences: "Save preferences",
    },
    filters: {
      timeRange: "Time range",
      rangeOptions: {
        today: "Today",
        week: "This week",
        month: "30 days",
        custom: "Custom",
        snapshot: "Archive week",
      },
      archiveWeek: "Archive week",
      from: "From",
      to: "To",
      topN: "Top N",
      search: "Search repo, description, owner",
      language: "Language",
      allLanguages: "All languages",
      sortBy: "Sort by",
      sortOrder: "Order",
      ascending: "Ascending",
      descending: "Descending",
      viewMode: "View",
    },
    summary: {
      totalProjects: "Projects tracked",
      totalRangeStars: "Stars in selected range",
      totalWeeklyStars: "Weekly stars",
      totalStars: "Total stars",
      totalForks: "Total forks",
      topLanguage: "Top language",
      freshestProject: "Freshest repo",
      lastFetchedAt: "Last fetched",
    },
    sections: {
      controlRoom: "Control room",
      rankings: "Ranking deck",
      charts: "Signal charts",
      compare: "Compare bay",
      autoSchedule: "Auto trigger",
      subscriptions: "Subscriptions",
      favorites: "Favorites",
      detail: "Repository dossier",
      history: "History",
      health: "Health",
      recommendations: "Recommendations",
      methodology: "Methodology",
      archive: "Archive",
      boards: "Collections",
      jobs: "Jobs",
      aiToolkit: "Product Manual",
    },
    schedule: {
      description: "Save a browser schedule for convenience, and use GitHub Actions for reliable server-side execution.",
      enabled: "Enable auto trigger",
      mode: "Mode",
      hourly: "Hourly",
      daily: "Daily",
      weekly: "Weekly",
      hour: "Hour",
      minute: "Minute",
      weekday: "Weekday",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
    subscriptions: {
      description: "Persist keyword subscriptions on the backend so alerts, reports, delivery logs, and email or webhook digests all share the same source of truth.",
      keywords: "Keywords",
      watchedProjects: "Watched projects",
      notifications: "Browser notifications",
    },
    charts: {
      languageDistribution: "Language distribution",
      starTrend: "Star growth comparison",
      dailyHeatmap: "Daily star heatmap",
      compareHint: "Pick 2 to 5 repositories for side-by-side trend analysis.",
      empty: "Select repositories to unlock the comparison chart.",
    },
    table: {
      empty: "No repositories match the current filters.",
      selected: "selected",
      columns: {
        select: "Select",
        rank: "Rank",
        repository: "Repository",
        language: "Language",
        totalStars: "Total stars",
        weeklyStars: "Weekly stars",
        todayStars: "Today",
        forks: "Forks",
        health: "Health",
        actions: "Actions",
      },
    },
    sortOptions: {
      rangeStars: "Selected range stars",
      stars: "Total stars",
      weeklyStars: "Weekly stars",
      forks: "Forks",
      updated: "Recent push",
      healthScore: "Health score",
    },
    detail: {
      description: "Repository brief",
      contributors: "Contributors",
      readme: "README summary",
      clone: "Clone URL",
      issueResponse: "Issue response",
      mergeRate: "PR merge rate",
      recentPush: "Recent push",
      noReadme: "README summary is not available yet.",
    },
    pages: {
      methodology: {
        title: "How the ranking works",
        intro: "This page explains where the data comes from, how scores are computed, and how to interpret gaps, limits, and refresh cycles.",
      },
      archive: {
        title: "Historical weekly archive",
        intro: "Review previous weekly snapshots, rank changes, and the projects that stayed hot over time.",
      },
      boards: {
        title: "Collections",
        intro: "Browse curated collections for AI, frontend, infrastructure, data, and developer productivity.",
      },
      jobs: {
        title: "Collection job center",
        intro: "Track backend runs, server-side schedules, and the health of your GitHub data ingestion pipeline.",
      },
      subscriptions: {
        title: "Subscription center",
        intro: "Review keyword alerts, collection follows, repository follows, delivery logs, and digest worker output persisted on the backend.",
      },
      ai: {
        title: "Product Manual",
        intro: "CLI shortcuts and generated summaries that help operators, users, and copilots understand this project faster.",
      },
    },
    misc: {
      favoritesEmpty: "No favorites yet.",
      yes: "Yes",
      no: "No",
      noDetail: "Select a repository to view its detailed dossier.",
      shareReady: "Share link copied to clipboard.",
      scheduleSaved: "Preferences saved on this device.",
      notificationsEnabled: "Notifications enabled.",
      historyPending: "Weekly stars support best-effort data for up to 7 days. Repositories without any comparable baseline will still show --.",
      noData: "No data yet.",
      generatedAt: "Generated at",
      status: "Status",
    },
  },
  "zh-CN": {
    nav: {
      title: productName["zh-CN"],
      subtitle: "面向开发者、分析师和内容团队的开源趋势情报产品",
      languageLabel: "语言",
      locales: { en: "English", "zh-CN": "中文" },
      links: {
        dashboard: "总览看板",
        archive: "历史归档",
        boards: "精选集合",
        subscriptions: "订阅中心",
        methodology: "方法说明",
        jobs: "任务中心",
        ai: "产品手册",
      },
    },
    hero: {
      kicker: "信号优先的产品视角",
      title: "一眼看清本周增长最快的 GitHub 热门仓库。",
      description: "一个支持中英文双语的开源趋势情报台，集成排行、归档、精选集合、任务状态和产品手册。",
    },
    actions: {
      trigger: "立即采集",
      triggering: "采集中...",
      refresh: "刷新数据",
      refreshing: "刷新中...",
      exportCsv: "导出 CSV",
      exportJson: "导出 JSON",
      exportReport: "生成报告",
      share: "分享快照",
      copied: "已复制",
      viewTable: "表格",
      viewCards: "卡片",
      batchFavorite: "批量收藏",
      batchExport: "批量导出",
      batchRead: "标记已读",
      clearSelection: "清空",
      openGithub: "打开 GitHub",
      copyRepo: "复制信息",
      favorite: "收藏",
      unfavorite: "取消收藏",
      compare: "加入对比",
      compared: "已对比",
      markRead: "标记已读",
      read: "已读",
      add: "添加",
      tag: "标签",
      close: "关闭",
      savePreferences: "保存偏好",
    },
    filters: {
      timeRange: "时间范围",
      rangeOptions: {
        today: "今日",
        week: "本周",
        month: "近 30 天",
        custom: "自定义",
        snapshot: "历史周档",
      },
      archiveWeek: "历史周次",
      from: "开始时间",
      to: "结束时间",
      topN: "榜单数量",
      search: "搜索项目名、描述、作者",
      language: "编程语言",
      allLanguages: "全部语言",
      sortBy: "排序指标",
      sortOrder: "排序方向",
      ascending: "升序",
      descending: "降序",
      viewMode: "视图模式",
    },
    summary: {
      totalProjects: "追踪项目数",
      totalRangeStars: "当前范围新增 Stars",
      totalWeeklyStars: "本周新增 Stars",
      totalStars: "总 Stars",
      totalForks: "总 Forks",
      topLanguage: "最热语言",
      freshestProject: "最近活跃项目",
      lastFetchedAt: "最近抓取时间",
    },
    sections: {
      controlRoom: "控制中心",
      rankings: "榜单主区",
      charts: "图表信号区",
      compare: "项目对比区",
      autoSchedule: "自动触发",
      subscriptions: "订阅提醒",
      favorites: "关注列表",
      detail: "项目档案",
      history: "历史趋势",
      health: "项目健康度",
      recommendations: "相关推荐",
      methodology: "方法说明",
      archive: "历史归档",
      boards: "精选集合",
      jobs: "任务中心",
      aiToolkit: "产品手册",
    },
    schedule: {
      description: "浏览器内自动触发只用于便捷操作，稳定采集请配合 GitHub Actions 或独立后端任务执行。",
      enabled: "开启自动触发",
      mode: "触发模式",
      hourly: "每小时",
      daily: "每天",
      weekly: "每周",
      hour: "小时",
      minute: "分钟",
      weekday: "星期",
      weekdays: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    },
    subscriptions: {
      description: "将关键词订阅持久化到后端，站内提醒、摘要推送、投递日志以及邮件或 webhook digest 都会复用这份配置。",
      keywords: "关键词",
      watchedProjects: "关注项目",
      notifications: "浏览器通知",
    },
    charts: {
      languageDistribution: "语言分布",
      starTrend: "Star 增长对比",
      dailyHeatmap: "每日新增 Star 热力图",
      compareHint: "选择 2 到 5 个项目后，可以查看并排趋势分析。",
      empty: "先选择项目，再查看对比图表。",
    },
    table: {
      empty: "当前筛选条件下没有匹配的项目。",
      selected: "已选",
      columns: {
        select: "选择",
        rank: "排名",
        repository: "项目",
        language: "语言",
        totalStars: "总 Stars",
        weeklyStars: "本周 Stars",
        todayStars: "今日 Stars",
        forks: "Forks",
        health: "健康度",
        actions: "操作",
      },
    },
    sortOptions: {
      rangeStars: "当前范围新增 Stars",
      stars: "总 Stars",
      weeklyStars: "本周 Stars",
      forks: "Forks",
      updated: "最近活跃时间",
      healthScore: "健康度",
    },
    detail: {
      description: "项目摘要",
      contributors: "贡献者",
      readme: "README 摘要",
      clone: "克隆地址",
      issueResponse: "Issue 响应时间",
      mergeRate: "PR 合并率",
      recentPush: "最近提交活跃度",
      noReadme: "暂时没有获取到 README 摘要。",
    },
    pages: {
      methodology: {
        title: "榜单方法说明",
        intro: "这里解释数据来源、计算方式、更新频率，以及如何理解覆盖范围和历史缺口。",
      },
      archive: {
        title: "历史周档归档",
        intro: "查看过去每一周的榜单快照、排名变化，以及哪些项目持续保持热度。",
      },
      boards: {
        title: "精选集合",
        intro: "按 AI、前端、基础设施、数据工具和效率工具等主题查看趋势项目。",
      },
      jobs: {
        title: "后端任务中心",
        intro: "查看后端采集、排行构建和数据同步任务的执行状态。",
      },
      subscriptions: {
        title: "订阅中心",
        intro: "统一查看关键词提醒、集合订阅、仓库订阅、投递日志和 digest worker 执行结果。",
      },
      ai: {
        title: "产品手册",
        intro: "通过 CLI、导出能力、订阅说明和问题排查指南，更快理解并使用这个产品。",
      },
    },
    misc: {
      favoritesEmpty: "还没有收藏项目。",
      yes: "是",
      no: "否",
      noDetail: "点击任意项目后，这里会显示更完整的项目档案。",
      shareReady: "分享链接已复制到剪贴板。",
      scheduleSaved: "当前偏好已保存在本机。",
      notificationsEnabled: "已开启通知。",
      historyPending: "本周 Star 最多支持近 7 天的尽力统计；只有在完全没有可比较基线时才会显示 --。",
      noData: "暂无数据。",
      generatedAt: "生成时间",
      status: "状态",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
