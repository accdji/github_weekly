import { notFound } from "next/navigation";
import { SubscriptionCenterClient } from "@/components/subscription-center-client";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { listRecentDeliveryJobs, listSubscriptions } from "@/lib/subscriptions";

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
  const [subscriptions, deliveries] = await Promise.all([
    listSubscriptions({
      includeDisabled: true,
    }),
    listRecentDeliveryJobs(),
  ]);
  const collectionSubscriptions = subscriptions.filter((item) => item.subscriptionType === "collection");
  const keywordSubscriptions = subscriptions.filter((item) => item.subscriptionType === "keyword");
  const repositorySubscriptions = subscriptions.filter((item) => item.subscriptionType === "repository");
  const copy = {
    collections: currentLocale === "zh-CN" ? "集合订阅" : "Collection follows",
    keywords: currentLocale === "zh-CN" ? "关键词提醒" : "Keyword alerts",
    repositories: currentLocale === "zh-CN" ? "仓库订阅" : "Repository follows",
    deliveries: currentLocale === "zh-CN" ? "最近投递" : "Recent deliveries",
  };

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.subscriptions}</p>
        <h1>{dictionary.pages.subscriptions.title}</h1>
        <p>{dictionary.pages.subscriptions.intro}</p>
        <div className="hero-chip-row">
          <div className="hero-chip">
            <span>{copy.collections}</span>
            <strong>{collectionSubscriptions.length}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.keywords}</span>
            <strong>{keywordSubscriptions.length}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.repositories}</span>
            <strong>{repositorySubscriptions.length}</strong>
          </div>
          <div className="hero-chip">
            <span>{copy.deliveries}</span>
            <strong>{deliveries.length}</strong>
          </div>
        </div>
      </section>

      <SubscriptionCenterClient locale={currentLocale} items={subscriptions} deliveries={deliveries} />
    </main>
  );
}
