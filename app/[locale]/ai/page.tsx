import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { buildAiContext } from "@/lib/ai-toolkit";
import { isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AiPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const context = await buildAiContext();
  const isZh = currentLocale === "zh-CN";

  const copy = isZh
    ? {
        kicker: "产品手册",
        title: "产品手册",
        intro: "这里集中说明当前产品面向开发、运营、分析和 AI Agent 的使用入口，包括 CLI 接入、订阅方式、常见问题、导出格式和关键 HTTP 接口。",
        overview: "当前概览",
        audience: "适合谁用",
        audienceEyebrow: "用户角色",
        quickStart: "推荐接入顺序",
        quickStartEyebrow: "快速开始",
        cli: "CLI 接入",
        cliEyebrow: "命令行",
        cliSetup: "CLI 环境准备",
        freshness: "数据更新与新鲜度",
        freshnessEyebrow: "数据更新",
        subscriptions: "如何订阅",
        subscriptionsEyebrow: "订阅",
        subscriptionPayload: "API 请求示例",
        exports: "导出格式",
        exportsEyebrow: "导出",
        exportFields: "导出字段说明",
        troubleshooting: "遇到问题如何解决",
        troubleshootingEyebrow: "排查建议",
        limitations: "当前能力边界",
        limitationsEyebrow: "能力边界",
        api: "HTTP 接口",
        apiEyebrow: "接口",
        semantics: "数据口径",
        semanticsEyebrow: "指标口径",
        files: "核心文件",
        filesEyebrow: "建议先读",
        contextJson: "产品手册 JSON",
        contextEyebrow: "JSON",
        trackedRepos: "已追踪仓库",
        snapshots: "快照数",
        subscriptionsCount: "订阅数",
        jobs: "任务数",
        latestWeek: "最新周榜",
        currentCoverage: "当前周覆盖",
        note: "说明",
        manualGeneratedAt: "手册生成时间",
        latestSnapshot: "最新快照",
        latestJobType: "最近任务类型",
        latestJobStatus: "最近任务状态",
        window: "窗口",
      }
    : {
        kicker: "Product Manual",
        title: "Product Manual",
        intro: "This page gathers the operator-facing surfaces of the product, including CLI access, subscription paths, troubleshooting notes, export formats, and core HTTP endpoints.",
        overview: "Current overview",
        audience: "Who this is for",
        audienceEyebrow: "Audience",
        quickStart: "Recommended flow",
        quickStartEyebrow: "Quick Start",
        cli: "CLI access",
        cliEyebrow: "CLI",
        cliSetup: "CLI environment setup",
        freshness: "Freshness and update rhythm",
        freshnessEyebrow: "Freshness",
        subscriptions: "How subscriptions work",
        subscriptionsEyebrow: "Subscriptions",
        subscriptionPayload: "API payload example",
        exports: "Export formats",
        exportsEyebrow: "Exports",
        exportFields: "Export field guide",
        troubleshooting: "Troubleshooting",
        troubleshootingEyebrow: "Troubleshooting",
        limitations: "Current product boundaries",
        limitationsEyebrow: "Boundaries",
        api: "HTTP entry points",
        apiEyebrow: "API",
        semantics: "Data semantics",
        semanticsEyebrow: "Semantics",
        files: "Core files",
        filesEyebrow: "Read First",
        contextJson: "Product manual JSON",
        contextEyebrow: "JSON",
        trackedRepos: "Tracked repositories",
        snapshots: "Snapshots",
        subscriptionsCount: "Subscriptions",
        jobs: "Jobs",
        latestWeek: "Latest ranking week",
        currentCoverage: "Current week coverage",
        note: "Note",
        manualGeneratedAt: "Manual generated at",
        latestSnapshot: "Latest snapshot",
        latestJobType: "Latest job type",
        latestJobStatus: "Latest job status",
        window: "Window",
      };

  const audienceItems = isZh
    ? [
        { role: "开发者 / 研究者", useCase: "发现正在快速上升的仓库，查看趋势，并快速导出榜单。" },
        { role: "内容 / 社区运营", useCase: "跟踪热点仓库，整理精选集合，产出周报或栏目素材。" },
        { role: "内部工具 / AI Agent", useCase: "消费结构化 JSON、仓库档案和稳定的 API 载荷。" },
      ]
    : context.audiences;

  const quickStartItems = isZh
    ? [
        "先运行 `npm run ai:context`，拿到当前产品手册上下文。",
        "如果 Dashboard 数据刚更新，先执行 `npm run collect:daily` 和 `npm run build:weekly`。",
        "如果精选集合内容刚变化，再执行 `npm run collections:sync`。",
        "如果代码结构有明显变动，执行 `npm run gitnexus:analyze` 刷新图数据库。",
      ]
    : context.quickStart;

  const cliSetupItems = isZh
    ? [
        "执行 `npm install` 安装依赖。",
        "执行 `npm run prisma:generate` 生成 Prisma Client。",
        "执行 `npm run db:push` 初始化数据库结构。",
        "如需认证 GitHub 请求，在 `.env` 中配置 `GH_TOKEN`。",
      ]
    : context.cliSetup.prerequisites;

  const cliRecipes = isZh
    ? [
        { goal: "刷新候选仓库和最新快照", command: "npm run collect:daily" },
        { goal: "回填最近 Star 历史", command: "npm run sync:stars" },
        { goal: "根据新快照重建周榜", command: "npm run build:weekly" },
        { goal: "同步精选集合与摘要卡片", command: "npm run collections:sync" },
        { goal: "执行完整后端采集流水线", command: "npm run pipeline:run" },
      ]
    : context.cliRecipes;

  const freshnessNote = isZh
    ? "前端页面本身是只读的。精选集合、排行榜和快照的新鲜度都依赖后端任务或 CLI 手动执行。"
    : context.freshness.note;

  const subscriptionGuide = isZh
    ? [
        { title: "在详情页订阅集合", description: "进入某个集合详情页，提交订阅表单后，后端会保存这条关注关系。" },
        { title: "在订阅中心统一查看", description: "通过 `/{locale}/subscriptions` 查看当前已经保存的集合订阅和关键词提醒。" },
        { title: "通过 API 创建", description: "向 `POST /api/subscriptions` 发送 `collectionId` 或 `keywords`，可供内部工具和自动化直接调用。" },
        { title: "当前投递边界", description: "当前版本先保证订阅意图入库，真正的外发投递任务仍属于后续后端建设阶段。" },
      ]
    : context.subscriptionGuide;

  const exportFormats = isZh
    ? [
        { format: "CSV", source: "Dashboard 导出按钮", purpose: "导出当前过滤后的仓库列表，适合表格分析。", notes: "适合运营、榜单复核和手工分享。" },
        { format: "JSON", source: "Dashboard 导出按钮与 `npm run ai:context`", purpose: "导出结构化数据，适合内部工具与自动化消费。", notes: "适合 Agent、脚本和下游系统接入。" },
        { format: "Markdown", source: "Dashboard 报告导出与 `npm run ai:report`", purpose: "导出周报摘要，适合直接发布或同步团队。", notes: "适合 Newsletter 和栏目化内容生产。" },
        { format: "仓库档案 JSON", source: "`npm run ai:repo -- owner/name`", purpose: "导出单个仓库的排行、快照和近期 Star 历史。", notes: "适合只关注单个仓库时使用。" },
      ]
    : context.exportFormats;

  const exportFieldGuide = isZh
    ? [
        { field: "fullName", meaning: "仓库的 owner/name 标识，Dashboard、导出和档案都会用到。" },
        { field: "weeklyStars", meaning: "最近一段周窗口内的 best-effort Star 增长，最多按 7 天计算。" },
        { field: "todayStars", meaning: "从当天 00:00 到现在累计的 Star 增长。" },
        { field: "stars", meaning: "最新仓库快照里的总 Star 数。" },
        { field: "historyCoverageDays", meaning: "当前用于计算周 Star 的可比较历史覆盖天数。" },
      ]
    : context.exportFieldGuide;

  const troubleshooting = isZh
    ? [
        { problem: "今日 Star 和本周 Star 看起来一样", fix: "重新执行 `npm run collect:daily` 后刷新页面。系统现在按今天 00:00 计算今日，按最多 7 天的 best-effort 数据计算本周。" },
        { problem: "本周 Star 显示 partial", fix: "这是正常现象，说明当前可比较快照还不足 7 天。页面和上下文会明确标注当前覆盖天数。" },
        { problem: "集合页面还是旧数据", fix: "在仓库采集之后，再执行一次 `npm run collections:sync`。" },
        { problem: "订阅已经创建，但没有收到外发消息", fix: "当前版本先保证订阅关系入库，真正的外发投递任务和渠道仍在后续建设中。" },
        { problem: "GitNexus 提示图数据库过期或被锁", fix: "执行 `npm run gitnexus:analyze`。如果本地锁还存在，先结束冲突进程，再重新执行。" },
      ]
    : context.troubleshooting;

  const limitations = isZh
    ? [
        "当前已经支持订阅意图持久化，但站外 Digest 投递仍属于后续后端阶段。",
        "PR、Issue、Contributor 的集合趋势已预留模型，但还没有完全接通真实数据。",
        "在可比较快照不足时，周 Star 会持续显示 partial。",
        "页面路由仍保留 `/{locale}/ai`，只是语义已经改成产品手册。",
      ]
    : context.limitations;

  const apiRoutes = isZh
    ? [
        { route: "/api/dashboard", purpose: "Dashboard 数据载荷" },
        { route: "/api/collections", purpose: "集合展馆首页数据" },
        { route: "/api/collections/[slug]", purpose: "集合详情数据" },
        { route: "/api/subscriptions", purpose: "创建或查询关键词 / 集合订阅" },
        { route: "/api/ai/context", purpose: "产品手册上下文 JSON" },
        { route: "/api/report", purpose: "Markdown 周报输出" },
      ]
    : context.apiRoutes;

  const overviewMetrics = [
    { label: copy.trackedRepos, value: String(context.stats.repositories) },
    { label: copy.snapshots, value: String(context.stats.snapshots) },
    { label: copy.subscriptionsCount, value: String(context.stats.subscriptions) },
    { label: copy.jobs, value: String(context.stats.jobs) },
    { label: copy.latestWeek, value: context.latestWeek ?? "--" },
    {
      label: copy.currentCoverage,
      value: context.starSemantics.weeklyCoverageComplete ? "7d" : `${Math.max(context.starSemantics.weeklyCoverageDays, 1)}d partial`,
    },
  ];

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </section>

      <section className="content-stack">
        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.kicker}</p>
              <h2>{copy.overview}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {overviewMetrics.map((metric) => (
              <div key={metric.label} className="archive-item">
                <strong>{metric.label}</strong>
                <span>{metric.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.audienceEyebrow}</p>
              <h2>{copy.audience}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {audienceItems.map((item) => (
              <div key={item.role} className="archive-item">
                <strong>{item.role}</strong>
                <span>{item.useCase}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.quickStartEyebrow}</p>
              <h2>{copy.quickStart}</h2>
            </div>
          </div>
          <ol className="content-list">
            {quickStartItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.cliEyebrow}</p>
              <h2>{copy.cli}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {cliRecipes.map((recipe) => (
              <div key={recipe.command} className="archive-item">
                <strong>{recipe.goal}</strong>
                <code className="code-pill">{recipe.command}</code>
              </div>
            ))}
          </div>
          <div className="deck__header" style={{ marginTop: "1.5rem" }}>
            <div>
              <p className="eyebrow">{copy.note}</p>
              <h2>{copy.cliSetup}</h2>
            </div>
          </div>
          <ol className="content-list">
            {cliSetupItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="muted">
            {isZh ? "CLI 命令是当前产品的运维入口，负责刷新数据、导出结果和查看上下文。" : context.cliSetup.note}
          </p>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.freshnessEyebrow}</p>
              <h2>{copy.freshness}</h2>
            </div>
          </div>
          <div className="archive-grid">
            <div className="archive-item">
              <strong>{copy.manualGeneratedAt}</strong>
              <span>{context.freshness.generatedAt}</span>
            </div>
            <div className="archive-item">
              <strong>{copy.latestSnapshot}</strong>
              <span>{context.freshness.latestSnapshotAt ?? "--"}</span>
            </div>
            <div className="archive-item">
              <strong>{copy.latestJobType}</strong>
              <span>{context.freshness.latestJobType ?? "--"}</span>
            </div>
            <div className="archive-item">
              <strong>{copy.latestJobStatus}</strong>
              <span>{context.freshness.latestJobStatus ?? "--"}</span>
            </div>
          </div>
          <p className="muted">{freshnessNote}</p>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.subscriptionsEyebrow}</p>
              <h2>{copy.subscriptions}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {subscriptionGuide.map((item) => (
              <div key={item.title} className="archive-item">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
          <div className="deck__header" style={{ marginTop: "1.5rem" }}>
            <div>
              <p className="eyebrow">POST</p>
              <h2>{copy.subscriptionPayload}</h2>
            </div>
          </div>
          <pre className="code-block">{JSON.stringify(context.subscriptionPayloadExample, null, 2)}</pre>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.exportsEyebrow}</p>
              <h2>{copy.exports}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {exportFormats.map((item) => (
              <div key={item.format} className="archive-item">
                <strong>{item.format}</strong>
                <span>{item.source}</span>
                <span>{item.purpose}</span>
                <span>{item.notes}</span>
              </div>
            ))}
          </div>
          <div className="deck__header" style={{ marginTop: "1.5rem" }}>
            <div>
              <p className="eyebrow">{copy.note}</p>
              <h2>{copy.exportFields}</h2>
            </div>
          </div>
          <div className="content-list">
            {exportFieldGuide.map((item) => (
              <div key={item.field} className="job-row">
                <div className="job-row__top">
                  <strong>{item.field}</strong>
                </div>
                <span>{item.meaning}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.troubleshootingEyebrow}</p>
              <h2>{copy.troubleshooting}</h2>
            </div>
          </div>
          <div className="content-list">
            {troubleshooting.map((item) => (
              <div key={item.problem} className="job-row">
                <div className="job-row__top">
                  <strong>{item.problem}</strong>
                  <span className="job-status job-status--running">{copy.note}</span>
                </div>
                <span>{item.fix}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.limitationsEyebrow}</p>
              <h2>{copy.limitations}</h2>
            </div>
          </div>
          <ol className="content-list">
            {limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.apiEyebrow}</p>
              <h2>{copy.api}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {apiRoutes.map((item) => (
              <div key={item.route} className="archive-item">
                <strong>{item.route}</strong>
                <span>{item.purpose}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.semanticsEyebrow}</p>
              <h2>{copy.semantics}</h2>
            </div>
          </div>
          <div className="collection-card__metrics">
            <div>
              <span>{copy.window}</span>
              <strong>{context.starSemantics.weeklyWindowDays}d</strong>
            </div>
            <div>
              <span>{copy.currentCoverage}</span>
              <strong>{context.starSemantics.weeklyCoverageComplete ? "7d" : `${Math.max(context.starSemantics.weeklyCoverageDays, 1)}d`}</strong>
            </div>
          </div>
          <p className="muted">
            {isZh
              ? context.starSemantics.weeklyCoverageComplete
                ? "当前周 Star 已具备完整 7 天覆盖。"
                : "当前周 Star 使用最多 7 天的 best-effort 数据，随着快照积累会自动切换到完整覆盖。"
              : context.starSemantics.note}
          </p>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.filesEyebrow}</p>
              <h2>{copy.files}</h2>
            </div>
          </div>
          <div className="content-list">
            {context.coreFiles.map((file) => (
              <code key={file} className="code-pill">
                {file}
              </code>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.contextEyebrow}</p>
              <h2>{copy.contextJson}</h2>
            </div>
          </div>
          <pre className="code-block">{JSON.stringify(context, null, 2)}</pre>
        </article>
      </section>
    </main>
  );
}
