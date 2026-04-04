import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { listSubscriptions } from "@/lib/subscriptions";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SubscriptionsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const subscriptions = await listSubscriptions();
  const collectionSubscriptions = subscriptions.filter((item) => item.subscriptionType === "collection");
  const keywordSubscriptions = subscriptions.filter((item) => item.subscriptionType === "keyword");
  const copy = {
    collectionsEyebrow: currentLocale === "zh-CN" ? "集合订阅" : "Collections",
    collectionsTitle: currentLocale === "zh-CN" ? "集合订阅" : "Collection follows",
    collectionFallback: currentLocale === "zh-CN" ? "集合" : "Collection",
    inAppAlert: currentLocale === "zh-CN" ? "站内提醒" : "In-app alert",
    noCollectionSubscriptions: currentLocale === "zh-CN" ? "还没有集合订阅。" : "No collection subscriptions yet.",
    alertsEyebrow: currentLocale === "zh-CN" ? "提醒规则" : "Alerts",
    alertsTitle: currentLocale === "zh-CN" ? "关键词提醒" : "Keyword alerts",
    noKeywordSubscriptions: currentLocale === "zh-CN" ? "还没有关键词提醒。" : "No keyword alerts yet.",
  };

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.subscriptions}</p>
        <h1>{dictionary.pages.subscriptions.title}</h1>
        <p>{dictionary.pages.subscriptions.intro}</p>
      </section>

      <section className="content-stack">
        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.collectionsEyebrow}</p>
              <h2>{copy.collectionsTitle}</h2>
            </div>
            <span className="code-pill">{collectionSubscriptions.length}</span>
          </div>
          <div className="content-list">
            {collectionSubscriptions.length ? (
              collectionSubscriptions.map((item) => (
                <div key={item.id} className="job-row">
                  <div className="job-row__top">
                    <strong>{item.collection?.name ?? copy.collectionFallback}</strong>
                    <span className="job-status job-status--success">{item.digestFrequency}</span>
                  </div>
                  <span>{item.email ?? copy.inAppAlert}</span>
                  <span>{item.collection?.description ?? "--"}</span>
                </div>
              ))
            ) : (
              <p>{copy.noCollectionSubscriptions}</p>
            )}
          </div>
        </article>

        <article className="content-card">
          <div className="deck__header">
            <div>
              <p className="eyebrow">{copy.alertsEyebrow}</p>
              <h2>{copy.alertsTitle}</h2>
            </div>
            <span className="code-pill">{keywordSubscriptions.length}</span>
          </div>
          <div className="content-list">
            {keywordSubscriptions.length ? (
              keywordSubscriptions.map((item) => (
                <div key={item.id} className="job-row">
                  <div className="job-row__top">
                    <strong>{item.keywords.length ? item.keywords.join(", ") : "--"}</strong>
                    <span className="job-status job-status--running">{item.channel}</span>
                  </div>
                  <span>{item.email ?? copy.inAppAlert}</span>
                  <span>{item.updatedAt}</span>
                </div>
              ))
            ) : (
              <p>{copy.noKeywordSubscriptions}</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
