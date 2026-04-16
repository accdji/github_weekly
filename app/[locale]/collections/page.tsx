import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCollectionsIndex } from "@/lib/collections";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
};

function sortCollections<
  T extends {
    featured: boolean;
    name: string;
    updatedAt: string;
    starsAdded: number;
  },
>(items: T[], sort: string) {
  const next = [...items];

  if (sort === "az") {
    return next.sort((left, right) => left.name.localeCompare(right.name));
  }

  if (sort === "new") {
    return next.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  if (sort === "popular") {
    return next.sort((left, right) => right.starsAdded - left.starsAdded || left.name.localeCompare(right.name));
  }

  if (sort === "archive") {
    return next.sort(
      (left, right) =>
        (right.updatedAt.slice(0, 4) || "").localeCompare(left.updatedAt.slice(0, 4) || "") ||
        left.name.localeCompare(right.name),
    );
  }

  return next.sort(
    (left, right) =>
      Number(right.featured) - Number(left.featured) ||
      right.starsAdded - left.starsAdded ||
      left.name.localeCompare(right.name),
  );
}

function buildCoverStyle(seed: string | null) {
  const source = seed ?? "collection";
  const score = Array.from(source).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  const hue = score % 360;
  const hue2 = (hue + 52) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 78% 56%), hsl(${hue2} 84% 41%))`,
  };
}

export default async function CollectionsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const search = query.q?.trim().toLowerCase() ?? "";
  const sort = query.sort ?? "featured";
  const collections = sortCollections(await getCollectionsIndex(), sort).filter((item) => {
    if (!search) {
      return true;
    }

    const text = `${item.name} ${item.description} ${item.tags.join(" ")} ${item.topRepositories.map((repo) => repo.fullName).join(" ")}`.toLowerCase();
    return text.includes(search);
  });

  const featuredCollections = collections.filter((item) => item.featured).slice(0, 2);
  const recentlyUpdated = [...collections].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 4);
  const popularCollections = [...collections].sort((left, right) => right.starsAdded - left.starsAdded).slice(0, 4);
  const archiveCollections = [...collections].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 6);
  const tagBrowse = Array.from(
    collections.reduce((map, collection) => {
      for (const tag of collection.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
      return map;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const totalFollowers = collections.reduce((total, collection) => total + collection.subscriptionCount, 0);
  const totalYears = new Set(collections.flatMap((item) => item.availableYears)).size;
  const copy = {
    title: currentLocale === "zh-CN" ? "精选集合" : "Collections",
    intro:
      currentLocale === "zh-CN"
        ? "这里已经不只是列表页，而是一个可提交、可审核、可订阅、可按年份回看的策展展厅。"
        : "This surface now acts like a curation gallery with public submission, moderation, subscriptions, and year-based browsing.",
    searchLabel: currentLocale === "zh-CN" ? "搜索集合" : "Search collections",
    browseModeLabel: currentLocale === "zh-CN" ? "浏览模式" : "Browse mode",
    featuredSort: currentLocale === "zh-CN" ? "精选优先" : "Featured",
    newSort: currentLocale === "zh-CN" ? "最近更新" : "New",
    popularSort: currentLocale === "zh-CN" ? "按热度" : "Popular",
    archiveSort: currentLocale === "zh-CN" ? "按历史" : "Archive",
    applyLabel: currentLocale === "zh-CN" ? "应用" : "Apply",
    submitLabel: currentLocale === "zh-CN" ? "提交新集合" : "Submit a collection",
    reviewLabel: currentLocale === "zh-CN" ? "审核工作台" : "Review workspace",
    totalYearsLabel: currentLocale === "zh-CN" ? "年份覆盖" : "Years covered",
    followersLabel: currentLocale === "zh-CN" ? "关注" : "Followers",
    weeklyStarsLabel: currentLocale === "zh-CN" ? "本周 Stars" : "Weekly stars",
    browseTagsHeading: currentLocale === "zh-CN" ? "标签入口" : "Tag browse",
    featuredHeading: currentLocale === "zh-CN" ? "精选展厅" : "Featured gallery",
    recentHeading: currentLocale === "zh-CN" ? "最近更新" : "Recently updated",
    hotHeading: currentLocale === "zh-CN" ? "热门集合" : "Popular collections",
    archiveHeading: currentLocale === "zh-CN" ? "历史浏览" : "Archive browse",
    viewCollectionLabel: currentLocale === "zh-CN" ? "查看详情" : "View collection",
    reposLabel: currentLocale === "zh-CN" ? "仓库数" : "Repos",
    yearsLabel: currentLocale === "zh-CN" ? "年份" : "Years",
  };

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.boards}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <div className="hero-chip-row">
          <div className="hero-chip">
            <span>{currentLocale === "zh-CN" ? "集合数" : "Collections"}</span>
            <strong>{collections.length}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.followersLabel}</span>
            <strong>{totalFollowers}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.weeklyStarsLabel}</span>
            <strong>+{collections.reduce((total, item) => total + item.starsAdded, 0)}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.totalYearsLabel}</span>
            <strong>{totalYears || 1}</strong>
          </div>
        </div>
        <div className="row-actions">
          <a className="primary-button" href={`/${currentLocale}/collections/submit`}>
            {copy.submitLabel}
          </a>
          <a className="secondary-button" href={`/${currentLocale}/collections/review`}>
            {copy.reviewLabel}
          </a>
        </div>
      </section>

      <section className="content-card">
        <form className="collections-toolbar" method="get">
          <label className="field field--search">
            <span>{copy.searchLabel}</span>
            <input name="q" defaultValue={query.q ?? ""} placeholder={copy.searchLabel} />
          </label>
          <label className="field">
            <span>{copy.browseModeLabel}</span>
            <select name="sort" defaultValue={sort}>
              <option value="featured">{copy.featuredSort}</option>
              <option value="new">{copy.newSort}</option>
              <option value="az">A-Z</option>
              <option value="popular">{copy.popularSort}</option>
              <option value="archive">{copy.archiveSort}</option>
            </select>
          </label>
          <button type="submit" className="secondary-button">
            {copy.applyLabel}
          </button>
        </form>
      </section>

      {featuredCollections.length ? (
        <section className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{dictionary.sections.boards}</p>
              <h2>{copy.featuredHeading}</h2>
            </div>
          </div>
          <div className="collections-showcase">
            {featuredCollections.map((collection, index) => (
              <article key={collection.slug} className={`collection-card ${index === 0 ? "collection-card--hero" : "collection-card--compact"}`}>
                <div className="collection-card__cover" style={buildCoverStyle(collection.coverImage)}>
                  <span>{collection.tags.slice(0, 2).join(" / ") || "Collection"}</span>
                  <strong>{collection.name}</strong>
                </div>
                <div className="collection-card__body">
                  <div className="card-headline">
                    <h2>{collection.name}</h2>
                    <p>{collection.description}</p>
                  </div>
                  <div className="inline-chips">
                    {collection.tags.map((tag) => (
                      <span key={`${collection.slug}-${tag}`} className="mini-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="collection-card__metrics">
                    <div>
                      <span>{copy.reposLabel}</span>
                      <strong>{collection.repositoryCount}</strong>
                    </div>
                    <div>
                      <span>{copy.followersLabel}</span>
                      <strong>{collection.subscriptionCount}</strong>
                    </div>
                    <div>
                      <span>{copy.weeklyStarsLabel}</span>
                      <strong>+{collection.starsAdded}</strong>
                    </div>
                    <div>
                      <span>{copy.yearsLabel}</span>
                      <strong>{collection.availableYears.join(", ")}</strong>
                    </div>
                  </div>
                  <div className="row-actions">
                    <a className="primary-button" href={`/${currentLocale}/collections/${collection.slug}`}>
                      {copy.viewCollectionLabel}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tagBrowse.length ? (
        <section className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{dictionary.sections.boards}</p>
              <h2>{copy.browseTagsHeading}</h2>
            </div>
          </div>
          <div className="inline-chips">
            {tagBrowse.map(([tag, count]) => (
              <span key={tag} className="mini-chip">
                {tag} / {count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="collections-grid collections-grid--secondary">
        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{dictionary.sections.archive}</p>
              <h2>{copy.recentHeading}</h2>
            </div>
          </div>
          <div className="collection-preview-list">
            {recentlyUpdated.map((collection) => (
              <a key={collection.slug} className="collection-preview-list__item" href={`/${currentLocale}/collections/${collection.slug}`}>
                <strong>{collection.name}</strong>
                <span>{collection.updatedAt.slice(0, 10)}</span>
              </a>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{dictionary.sections.rankings}</p>
              <h2>{copy.hotHeading}</h2>
            </div>
          </div>
          <div className="collection-preview-list">
            {popularCollections.map((collection) => (
              <a key={collection.slug} className="collection-preview-list__item" href={`/${currentLocale}/collections/${collection.slug}`}>
                <strong>{collection.name}</strong>
                <span>+{collection.starsAdded}</span>
              </a>
            ))}
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="deck__header">
          <div>
            <p className="eyebrow">{dictionary.sections.archive}</p>
            <h2>{copy.archiveHeading}</h2>
          </div>
        </div>
        <div className="collection-preview-list">
          {archiveCollections.map((collection) => (
            <a key={`archive-${collection.slug}`} className="collection-preview-list__item" href={`/${currentLocale}/collections/${collection.slug}?year=${collection.availableYears[0] ?? new Date().getUTCFullYear()}`}>
              <strong>{collection.name}</strong>
              <span>{collection.availableYears.join(", ")}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="collections-grid">
        {collections.map((collection) => (
          <article key={collection.slug} className="collection-card">
            <div className="collection-card__cover" style={buildCoverStyle(collection.coverImage)}>
              <span>{collection.featured ? "Featured" : "Collection"}</span>
              <strong>{collection.name}</strong>
            </div>
            <div className="collection-card__body">
              <div className="card-headline">
                <h2>{collection.name}</h2>
                <p>{collection.description}</p>
              </div>
              <div className="inline-chips">
                {collection.tags.map((tag) => (
                  <span key={`${collection.slug}-${tag}`} className="mini-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="collection-card__metrics">
                <div>
                  <span>{copy.reposLabel}</span>
                  <strong>{collection.repositoryCount}</strong>
                </div>
                <div>
                  <span>{copy.weeklyStarsLabel}</span>
                  <strong>+{collection.starsAdded}</strong>
                </div>
                <div>
                  <span>PR</span>
                  <strong>{collection.prsOpened}</strong>
                </div>
                <div>
                  <span>Issues</span>
                  <strong>{collection.issuesOpened}</strong>
                </div>
                <div>
                  <span>{currentLocale === "zh-CN" ? "贡献者" : "Contributors"}</span>
                  <strong>{collection.activeContributors}</strong>
                </div>
                <div>
                  <span>{copy.yearsLabel}</span>
                  <strong>{collection.availableYears.join(", ")}</strong>
                </div>
              </div>
              <div className="collection-preview-list">
                {collection.topRepositories.map((repo) => (
                  <a key={`${collection.slug}-${repo.repositoryId}`} href={`/${currentLocale}/repo/${repo.owner}/${repo.name}`} className="collection-preview-list__item">
                    <strong>{repo.fullName}</strong>
                    <span>+{repo.weeklyStars}</span>
                  </a>
                ))}
              </div>
              <div className="row-actions">
                <a className="secondary-button" href={`/${currentLocale}/collections/${collection.slug}`}>
                  {copy.viewCollectionLabel}
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
