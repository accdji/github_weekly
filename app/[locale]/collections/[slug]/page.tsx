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
  searchParams: Promise<{
    year?: string;
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

function buildCoverStyle(seed: string | null) {
  const source = seed ?? "collection";
  const score = Array.from(source).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  const hue = score % 360;
  const hue2 = (hue + 48) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 80% 56%), hsl(${hue2} 78% 38%))`,
  };
}

export default async function CollectionDetailPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { year } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const selectedYear = year ? Number(year) : new Date().getUTCFullYear();
  const detail = await getCollectionDetail(slug, Number.isFinite(selectedYear) ? selectedYear : new Date().getUTCFullYear());

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
    thisYear: currentLocale === "zh-CN" ? "年份" : "Year",
    methodology: currentLocale === "zh-CN" ? "指标口径" : "Methodology",
    repositories: currentLocale === "zh-CN" ? "收录仓库" : "Repositories",
    followers: currentLocale === "zh-CN" ? `订阅 ${detail.subscriptionCount}` : `${detail.subscriptionCount} followers`,
    repositoryCount: currentLocale === "zh-CN" ? "仓库数" : "Repositories",
    totalStars: currentLocale === "zh-CN" ? "总 Stars" : "Total stars",
    weeklyStars: currentLocale === "zh-CN" ? "本周 Stars" : "Weekly stars",
    forks: currentLocale === "zh-CN" ? "Forks" : "Forks",
    issues: currentLocale === "zh-CN" ? "Issues" : "Issues",
    contributors: currentLocale === "zh-CN" ? "活跃贡献者" : "Active contributors",
    yearTrend: currentLocale === "zh-CN" ? "年度趋势" : "Year trend",
    historyHeading: currentLocale === "zh-CN" ? "历史快照" : "Historical snapshots",
    keepBrowsing: currentLocale === "zh-CN" ? "继续浏览" : "Keep browsing",
    relatedCollections: currentLocale === "zh-CN" ? "相关集合" : "Related collections",
    openCollection: currentLocale === "zh-CN" ? "打开集合" : "Open collection",
  };

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <div className="collection-card__cover" style={buildCoverStyle(detail.coverImage)}>
          <span>{detail.tags.slice(0, 2).join(" / ") || "Collection"}</span>
          <strong>{detail.name}</strong>
        </div>
        <p className="eyebrow">{dictionary.sections.boards}</p>
        <h1>{detail.name}</h1>
        <p>{detail.description}</p>
        <div className="inline-chips">
          <span className="mini-chip mini-chip--accent">{copy.followers}</span>
          {detail.tags.map((tag) => (
            <span key={`${detail.slug}-${tag}`} className="mini-chip">
              {tag}
            </span>
          ))}
        </div>
        <div className="row-actions">
          {detail.availableYears.map((item) => (
            <a
              key={item}
              className={item === detail.selectedYear ? "primary-button" : "secondary-button"}
              href={`/${currentLocale}/collections/${detail.slug}?year=${item}`}
            >
              {copy.thisYear} {item}
            </a>
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
          <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} role="img" aria-label="Collection trend chart">
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
        </div>
      </section>

      <section className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{dictionary.sections.archive}</p>
            <h2>{copy.historyHeading}</h2>
          </div>
        </div>
        <div className="archive-grid">
          {detail.historicalSnapshots.slice(0, 12).map((item) => (
            <div key={`${item.snapshotDate}-${item.year}`} className="archive-item">
              <strong>{item.snapshotDate.slice(0, 10)}</strong>
              <span>{item.year}</span>
              <span>+{item.starsAdded} stars</span>
              <span>{item.prsOpened} PR</span>
              <span>{item.issuesOpened} issues</span>
              <span>{item.activeContributors} contributors</span>
            </div>
          ))}
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
                    <p className="repo-copy">{repo.description ?? repo.hotReason}</p>
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
                    <p>{collection.repositoryCount} repositories</p>
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
