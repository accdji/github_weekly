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

  return next.sort(
    (left, right) =>
      Number(right.featured) - Number(left.featured) ||
      right.starsAdded - left.starsAdded ||
      left.name.localeCompare(right.name),
  );
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

  const copy = {
    title: currentLocale === "zh-CN" ? "精选集合" : "Collections",
    intro:
      currentLocale === "zh-CN"
        ? "以集合方式浏览正在快速增长的开源主题。这里的内容由后端任务持续维护，不再依赖浏览器触发采集。"
        : "Browse rising open-source themes as curated collections. These listings are maintained by backend jobs rather than browser-triggered collection runs.",
    searchLabel: currentLocale === "zh-CN" ? "搜索集合" : "Search collections",
    empty:
      currentLocale === "zh-CN"
        ? "当前还没有可用的集合数据。先执行 `npm run collections:sync`，再刷新页面。"
        : "No collections are available yet. Run `npm run collections:sync` and refresh the page.",
    countLabel: currentLocale === "zh-CN" ? "集合数" : "Collections",
    followerLabel: currentLocale === "zh-CN" ? "关注数" : "Followers",
    weeklyStarsLabel: currentLocale === "zh-CN" ? "本周 Stars" : "Weekly stars",
    browseModeLabel: currentLocale === "zh-CN" ? "浏览方式" : "Browse mode",
    featuredSort: currentLocale === "zh-CN" ? "精选优先" : "Featured",
    newSort: currentLocale === "zh-CN" ? "最近更新" : "New",
    popularSort: currentLocale === "zh-CN" ? "按热度" : "Popular",
    applyLabel: currentLocale === "zh-CN" ? "应用" : "Apply",
    featuredEyebrow: currentLocale === "zh-CN" ? "精选展馆" : "Featured gallery",
    featuredHeading: currentLocale === "zh-CN" ? "精选集合" : "Featured Collections",
    curatedPick: currentLocale === "zh-CN" ? "策展精选" : "Curated pick",
    totalStarsLabel: currentLocale === "zh-CN" ? "总 Stars" : "Total stars",
    followersLabel: currentLocale === "zh-CN" ? "关注" : "Followers",
    reposLabel: currentLocale === "zh-CN" ? "仓库数" : "Repos",
    enterGalleryLabel: currentLocale === "zh-CN" ? "进入展馆" : "Enter gallery",
    browseTagsEyebrow: currentLocale === "zh-CN" ? "按标签浏览" : "Browse by tags",
    browseTagsHeading: currentLocale === "zh-CN" ? "标签入口" : "Tag browse",
    recentEyebrow: currentLocale === "zh-CN" ? "近期更新" : "Recently updated",
    recentHeading: currentLocale === "zh-CN" ? "最近更新" : "Recently updated",
    hotEyebrow: currentLocale === "zh-CN" ? "今年热度" : "Popular this year",
    hotHeading: currentLocale === "zh-CN" ? "热门集合" : "Popular collections",
    featuredBadge: currentLocale === "zh-CN" ? "精选" : "Featured",
    collectionBadge: currentLocale === "zh-CN" ? "集合" : "Collection",
    weeklyGrowthLabel: currentLocale === "zh-CN" ? "周增 Stars" : "Weekly stars",
    contributorsLabel: currentLocale === "zh-CN" ? "活跃贡献者" : "Contributors",
    subscriptionsLabel: currentLocale === "zh-CN" ? "订阅" : "Followers",
    viewCollectionLabel: currentLocale === "zh-CN" ? "查看详情" : "View collection",
  };

  const featuredCollections = collections.filter((item) => item.featured).slice(0, 2);
  const recentlyUpdated = [...collections].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 4);
  const popularCollections = [...collections].sort((left, right) => right.starsAdded - left.starsAdded).slice(0, 4);
  const tagBrowse = Array.from(
    collections.reduce((map, collection) => {
      for (const tag of collection.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
      return map;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const totalFollowers = collections.reduce((total, collection) => total + collection.subscriptionCount, 0);

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.boards}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <div className="hero-chip-row">
          <div className="hero-chip">
            <span>{copy.countLabel}</span>
            <strong>{collections.length}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.followerLabel}</span>
            <strong>{totalFollowers}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.weeklyStarsLabel}</span>
            <strong>+{collections.reduce((total, item) => total + item.starsAdded, 0)}</strong>
          </div>
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
              <p className="eyebrow">{copy.featuredEyebrow}</p>
              <h2>{copy.featuredHeading}</h2>
            </div>
          </div>
          <div className="collections-showcase">
            {featuredCollections.map((collection, index) => (
              <article key={collection.slug} className={`collection-card ${index === 0 ? "collection-card--hero" : "collection-card--compact"}`}>
                <div className="collection-card__cover">
                  <span>{copy.curatedPick}</span>
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
                      <span>{copy.totalStarsLabel}</span>
                      <strong>{collection.totalStars}</strong>
                    </div>
                    <div>
                      <span>{copy.followersLabel}</span>
                      <strong>{collection.subscriptionCount}</strong>
                    </div>
                    <div>
                      <span>{copy.reposLabel}</span>
                      <strong>{collection.repositoryCount}</strong>
                    </div>
                    <div>
                      <span>{copy.weeklyStarsLabel}</span>
                      <strong>+{collection.starsAdded}</strong>
                    </div>
                  </div>
                  <div className="row-actions">
                    <a className="primary-button" href={`/${currentLocale}/collections/${collection.slug}`}>
                      {copy.enterGalleryLabel}
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
              <p className="eyebrow">{copy.browseTagsEyebrow}</p>
              <h2>{copy.browseTagsHeading}</h2>
            </div>
          </div>
          <div className="inline-chips">
            {tagBrowse.map(([tag, count]) => (
              <span key={tag} className="mini-chip">
                {tag} · {count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="collections-grid collections-grid--secondary">
        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.recentEyebrow}</p>
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
              <p className="eyebrow">{copy.hotEyebrow}</p>
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

      <section className="collections-grid">
        {collections.length ? (
          collections.map((collection) => (
            <article key={collection.slug} className="collection-card">
              <div className="collection-card__cover">
                <span>{collection.featured ? copy.featuredBadge : copy.collectionBadge}</span>
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
                    <span>{copy.totalStarsLabel}</span>
                    <strong>{collection.totalStars}</strong>
                  </div>
                  <div>
                    <span>{copy.weeklyGrowthLabel}</span>
                    <strong>+{collection.starsAdded}</strong>
                  </div>
                  <div>
                    <span>PR</span>
                    <strong>{collection.prsOpened}</strong>
                  </div>
                  <div>
                    <span>{copy.contributorsLabel}</span>
                    <strong>{collection.activeContributors}</strong>
                  </div>
                  <div>
                    <span>{copy.subscriptionsLabel}</span>
                    <strong>{collection.subscriptionCount}</strong>
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
          ))
        ) : (
          <article className="content-card">
            <p>{copy.empty}</p>
          </article>
        )}
      </section>
    </main>
  );
}
