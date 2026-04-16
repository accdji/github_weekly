import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { buildAiContext } from "@/lib/ai-toolkit";
import { isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

type Copy = {
  kicker: string;
  title: string;
  intro: string;
  overview: string;
  audience: string;
  audienceEyebrow: string;
  quickStart: string;
  quickStartEyebrow: string;
  cli: string;
  cliEyebrow: string;
  cliSetup: string;
  freshness: string;
  freshnessEyebrow: string;
  subscriptions: string;
  subscriptionsEyebrow: string;
  subscriptionPayload: string;
  exports: string;
  exportsEyebrow: string;
  exportFields: string;
  troubleshooting: string;
  troubleshootingEyebrow: string;
  limitations: string;
  limitationsEyebrow: string;
  api: string;
  apiEyebrow: string;
  semantics: string;
  semanticsEyebrow: string;
  files: string;
  filesEyebrow: string;
  contextJson: string;
  contextEyebrow: string;
  trackedRepos: string;
  snapshots: string;
  subscriptionsCount: string;
  jobs: string;
  latestWeek: string;
  currentCoverage: string;
  note: string;
  manualGeneratedAt: string;
  latestSnapshot: string;
  latestJobType: string;
  latestJobStatus: string;
  window: string;
};

function getCopy(locale: Locale): Copy {
  if (locale === "zh-CN") {
    return {
      kicker: "产品手册",
      title: "产品手册",
      intro: "这里集中说明当前产品面向开发、运营、分析和 AI Agent 的使用入口，包括 CLI、订阅路径、排查建议、导出格式和关键 HTTP 接口。",
      overview: "当前概览",
      audience: "适合谁用",
      audienceEyebrow: "用户角色",
      quickStart: "推荐接入顺序",
      quickStartEyebrow: "快速开始",
      cli: "CLI 接入",
      cliEyebrow: "CLI",
      cliSetup: "CLI 环境准备",
      freshness: "数据刷新与新鲜度",
      freshnessEyebrow: "新鲜度",
      subscriptions: "如何订阅",
      subscriptionsEyebrow: "订阅",
      subscriptionPayload: "API 请求示例",
      exports: "导出格式",
      exportsEyebrow: "导出",
      exportFields: "导出字段说明",
      troubleshooting: "遇到问题如何解决",
      troubleshootingEyebrow: "排查建议",
      limitations: "当前能力边界",
      limitationsEyebrow: "边界",
      api: "HTTP 接口",
      apiEyebrow: "接口",
      semantics: "数据口径",
      semanticsEyebrow: "口径",
      files: "核心文件",
      filesEyebrow: "建议先读",
      contextJson: "产品手册 JSON",
      contextEyebrow: "JSON",
      trackedRepos: "已跟踪仓库",
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
    };
  }

  return {
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
}

export default async function AiPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const context = await buildAiContext();
  const copy = getCopy(currentLocale);
  const isZh = currentLocale === "zh-CN";

  const overviewMetrics = [
    { label: copy.trackedRepos, value: String(context.stats.repositories) },
    { label: copy.snapshots, value: String(context.stats.snapshots) },
    { label: copy.subscriptionsCount, value: String(context.stats.subscriptions) },
    { label: copy.jobs, value: String(context.stats.jobs) },
    { label: copy.latestWeek, value: context.latestWeek ?? "--" },
    {
      label: copy.currentCoverage,
      value: context.starSemantics.weeklyCoverageComplete
        ? "7d"
        : `${Math.max(context.starSemantics.weeklyCoverageDays, 1)}d partial`,
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
            {context.audiences.map((item) => (
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
            {context.quickStart.map((item) => (
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
            {context.cliRecipes.map((recipe) => (
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
            {context.cliSetup.prerequisites.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="muted">{context.cliSetup.note}</p>
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
          <p className="muted">{context.freshness.note}</p>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.subscriptionsEyebrow}</p>
              <h2>{copy.subscriptions}</h2>
            </div>
          </div>
          <div className="archive-grid">
            {context.subscriptionGuide.map((item) => (
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
            {context.exportFormats.map((item) => (
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
            {context.exportFieldGuide.map((item) => (
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
            {context.troubleshooting.map((item) => (
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
            {context.limitations.map((item) => (
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
            {context.apiRoutes.map((item) => (
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
              <strong>
                {context.starSemantics.weeklyCoverageComplete
                  ? "7d"
                  : `${Math.max(context.starSemantics.weeklyCoverageDays, 1)}d`}
              </strong>
            </div>
          </div>
          <p className="muted">{context.starSemantics.note}</p>
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
