import type { Locale } from "@/lib/i18n";

type MethodologySection = {
  title: string;
  items: string[];
};

export function getMethodologySections(locale: Locale = "en"): MethodologySection[] {
  if (locale === "zh-CN") {
    return [
      {
        title: "数据来源",
        items: [
          "通过 GitHub REST Search API 发现候选仓库。",
          "在本地保存仓库快照，用于记录 forks、stars、issues 和更新时间。",
          "当配置了令牌时，通过 GitHub GraphQL 获取 stargazer 历史。",
        ],
      },
      {
        title: "排名逻辑",
        items: [
          "周度 Star 增量优先使用 stargazer 历史；当历史不完整时，回退到快照差值。",
          "Fork 增长和最近 push 活跃度会作为辅助信号参与判断。",
          "精选集合复用同一份数据集，只是在展示层按主题规则进行聚合。",
        ],
      },
      {
        title: "可靠性规则",
        items: [
          "所有任务都在服务端记录，方便查看失败原因和刷新窗口。",
          "历史不完整时会显示 `--` 或 partial，而不是误导性的 0。",
          "服务端调度应优先使用 GitHub Actions 或 cron，而不是只依赖浏览器定时器。",
        ],
      },
      {
        title: "AI 与工具接入",
        items: [
          "AI 上下文和报告输出都基于与前端一致的 Dashboard 数据集生成。",
          "仓库档案会提供适合提示词消费的短历史摘要。",
          "发生较大代码变更后，可以刷新 GitNexus 图谱以保持符号级上下文最新。",
        ],
      },
    ];
  }

  return [
    {
      title: "Data sources",
      items: [
        "GitHub REST Search API for candidate repository discovery",
        "Repository snapshots stored locally for forks, stars, issues, and freshness",
        "GitHub GraphQL stargazer history when a token is configured",
      ],
    },
    {
      title: "Ranking logic",
      items: [
        "Weekly star delta is preferred from stargazer history, with snapshot fallback when history is incomplete",
        "Fork growth and recent push activity are added as supporting signals",
        "Boards reuse the same dataset but group repositories by thematic heuristics",
      ],
    },
    {
      title: "Reliability rules",
      items: [
        "Jobs are recorded server-side so failures and refresh windows are visible",
        "Incomplete history is displayed as '--' instead of a misleading zero",
        "Server-side schedules should use GitHub Actions or cron instead of relying only on browser timers",
      ],
    },
    {
      title: "AI integration",
      items: [
        "AI context and report outputs are generated from the same dashboard dataset used by the frontend",
        "Repository dossiers provide short-form trend history for repo-specific prompts",
        "GitNexus can be refreshed after major changes to keep symbol-level graph context current",
      ],
    },
  ];
}
