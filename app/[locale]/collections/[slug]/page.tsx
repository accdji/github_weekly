import { notFound } from "next/navigation";
import { CollectionSubscribeForm } from "@/components/collection-subscribe-form";
import { SiteHeader } from "@/components/site-header";
import { formatCompactNumber } from "@/components/dashboard-visuals";
import { getCollectionDetail } from "@/lib/collections";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

function buildPolyline(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x = 20 + (index / Math.max(values.length - 1, 1)) * (width - 40);
      const y = height - 20 - (value / max) * (height - 40);
      return `${x},${y}`;
    })
    .join(" ");
}

function localizeHotReason(reason: string | null | undefined, locale: Locale) {
  if (!reason || locale !== "zh-CN") {
    return reason ?? null;
  }

  if (reason === "AI-related momentum plus strong recent star growth.") {
    return "AI 相关热度叠加强劲的近期 Star 增长。";
  }

  if (reason === "Recently pushed code and visible weekly star acceleration.") {
    return "最近代码活跃提交，且本周 Star 增速明显。";
  }

  if (reason === "Large developer adoption signal with strong ecosystem pull.") {
    return "开发者采用信号强，生态带动明显。";
  }

  if (reason === "Steady open-source growth supported by stars, forks, and recent activity.") {
    return "Stars、Forks 和近期活跃度共同支撑了稳定增长。";
  }

  return reason;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const detail = await getCollectionDetail(slug);

  if (!detail) {
    notFound();
  }

  const starsSeries = detail.trend.map((point) => point.starsAdded);
  const prsSeries = detail.trend.map((point) => point.prsOpened);
  const issuesSeries = detail.trend.map((point) => point.issuesOpened);
  const contributorSeries = detail.trend.map((point) => point.activeContributors);
  const trendWidth = 960;
  const trendHeight = 260;
  const copy = {
    eyebrow: currentLocale === "zh-CN" ? "精选集合" : "Collection",
    thisYear: currentLocale === "zh-CN" ? "今年以来" : "This year",
    methodology: currentLocale === "zh-CN" ? "指标口径" : "Methodology",
    repositories: currentLocale === "zh-CN" ? "收录仓库" : "Repositories",
    followers: currentLocale === "zh-CN" ? `订阅 ${detail.subscriptionCount}` : `${detail.subscriptionCount} followers`,
    repositoryCount: currentLocale === "zh-CN" ? "仓库数" : "Repositories",
    totalStars: currentLocale === "zh-CN" ? "总 Stars" : "Total stars",
    weeklyStars: currentLocale === "zh-CN" ? "本周 Stars" : "Weekly stars",
    forks: currentLocale === "zh-CN" ? "Forks" : "Forks",
    issues: currentLocale === "zh-CN" ? "Issues" : "Issues",
    contributors: currentLocale === "zh-CN" ? "活跃贡献者" : "Active contributors",
    yearTrend: currentLocale === "zh-CN" ? "年度趋势" : "Year-to-date trend",
    contributorsLegend: currentLocale === "zh-CN" ? "贡献者" : "Contributors",
    keepBrowsing: currentLocale === "zh-CN" ? "继续浏览" : "Keep browsing",
    relatedCollections: currentLocale === "zh-CN" ? "相关集合" : "Related collections",
    repositoriesTracked: (count: number) =>
      currentLocale === "zh-CN" ? `收录 ${count} 个仓库` : `${count} repositories tracked`,
    openCollection: currentLocale === "zh-CN" ? "打开集合" : "Open collection",
    trendAria: currentLocale === "zh-CN" ? "集合趋势图" : "Collection trend chart",
  };

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{detail.name}</h1>
        <p>{detail.description}</p>
        <div className="inline-chips">
          <span className="mini-chip mini-chip--accent">{copy.thisYear}</span>
          <span className="mini-chip">{copy.followers}</span>
          {detail.tags.map((tag) => (
            <span key={`${detail.slug}-${tag}`} className="mini-chip">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="content-card">
        <CollectionSubscribeForm
          collectionId={detail.id}
          collectionName={detail.name}
          locale={currentLocale}
          initialCount={detail.subscriptionCount}
        />
      </section>

      <section className="content-card">
        <div className="collection-card__metrics">
          <div>
            <span>{copy.repositoryCount}</span>
            <strong>{detail.summary.repositoryCount}</strong>
          </div>
          <div>
            <span>{copy.totalStars}</span>
            <strong>{formatCompactNumber(detail.summary.totalStars)}</strong>
          </div>
          <div>
            <span>{copy.weeklyStars}</span>
            <strong>+{formatCompactNumber(detail.summary.weeklyStars)}</strong>
          </div>
          <div>
            <span>{copy.forks}</span>
            <strong>{formatCompactNumber(detail.summary.totalForks)}</strong>
          </div>
          <div>
            <span>{copy.issues}</span>
            <strong>{formatCompactNumber(detail.summary.openIssues)}</strong>
          </div>
          <div>
            <span>{copy.contributors}</span>
            <strong>{formatCompactNumber(detail.summary.activeContributors)}</strong>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{dictionary.sections.charts}</p>
            <h2>{copy.yearTrend}</h2>
          </div>
        </div>
        <div className="collection-trend-card">
          <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} role="img" aria-label={copy.trendAria}>
            <rect x="0" y="0" width={trendWidth} height={trendHeight} rx="24" className="trend-chart__bg" />
            {[0.2, 0.4, 0.6, 0.8].map((line) => (
              <line
                key={line}
                x1="20"
                y1={20 + (trendHeight - 40) * line}
                x2={trendWidth - 20}
                y2={20 + (trendHeight - 40) * line}
                className="trend-chart__grid"
              />
            ))}
            <polyline fill="none" stroke="#56e0ff" strokeWidth="3" points={buildPolyline(starsSeries, trendWidth, trendHeight)} />
            <polyline fill="none" stroke="#4dffd2" strokeWidth="3" points={buildPolyline(prsSeries, trendWidth, trendHeight)} />
            <polyline fill="none" stroke="#ffbf5f" strokeWidth="3" points={buildPolyline(issuesSeries, trendWidth, trendHeight)} />
            <polyline fill="none" stroke="#ff5fd2" strokeWidth="3" points={buildPolyline(contributorSeries, trendWidth, trendHeight)} />
          </svg>
          <div className="trend-chart__legend">
            <div className="trend-chart__legend-item">
              <span className="trend-chart__legend-swatch" style={{ backgroundColor: "#56e0ff" }} />
              <span>Stars</span>
            </div>
            <div className="trend-chart__legend-item">
              <span className="trend-chart__legend-swatch" style={{ backgroundColor: "#4dffd2" }} />
              <span>PR</span>
            </div>
            <div className="trend-chart__legend-item">
              <span className="trend-chart__legend-swatch" style={{ backgroundColor: "#ffbf5f" }} />
              <span>Issues</span>
            </div>
            <div className="trend-chart__legend-item">
              <span className="trend-chart__legend-swatch" style={{ backgroundColor: "#ff5fd2" }} />
              <span>{copy.contributorsLegend}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{copy.repositories}</p>
            <h2>{copy.repositories}</h2>
          </div>
        </div>
        <div className="table-shell">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>{dictionary.table.columns.rank}</th>
                <th>{dictionary.table.columns.repository}</th>
                <th>{dictionary.table.columns.language}</th>
                <th>{dictionary.table.columns.weeklyStars}</th>
                <th>{dictionary.table.columns.totalStars}</th>
                <th>{dictionary.table.columns.forks}</th>
              </tr>
            </thead>
            <tbody>
              {detail.repositories.map((repo, index) => (
                <tr key={`${detail.slug}-${repo.repositoryId}`}>
                  <td>#{index + 1}</td>
                  <td>
                    <a className="repo-link" href={`/${currentLocale}/repo/${repo.owner}/${repo.name}`}>
                      {repo.fullName}
                    </a>
                    <p className="repo-copy">{repo.description ?? localizeHotReason(repo.hotReason, currentLocale)}</p>
                  </td>
                  <td>{repo.language ?? "--"}</td>
                  <td>+{formatCompactNumber(repo.weeklyStars)}</td>
                  <td>{formatCompactNumber(repo.stars)}</td>
                  <td>{formatCompactNumber(repo.forks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card">
        <div className="card-headline">
          <h2>{copy.methodology}</h2>
          <p>{detail.methodologyNote}</p>
        </div>
      </section>

      {detail.relatedCollections.length ? (
        <section className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.keepBrowsing}</p>
              <h2>{copy.relatedCollections}</h2>
            </div>
          </div>
          <div className="collections-grid">
            {detail.relatedCollections.map((collection) => (
              <article key={collection.slug} className="collection-card collection-card--compact">
                <div className="collection-card__body">
                  <div className="card-headline">
                    <h2>{collection.name}</h2>
                    <p>{copy.repositoriesTracked(collection.repositoryCount)}</p>
                  </div>
                  <div className="inline-chips">
                    {collection.tags.map((tag) => (
                      <span key={`${collection.slug}-${tag}`} className="mini-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="row-actions">
                    <a className="secondary-button" href={`/${currentLocale}/collections/${collection.slug}`}>
                      {copy.openCollection}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
