import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getRepositoryTrend } from "@/lib/archive";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 600;

type PageProps = {
  params: Promise<{
    locale: string;
    owner: string;
    name: string;
  }>;
};

export default async function RepositoryTrendPage({ params }: PageProps) {
  const { locale, owner, name } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const data = await getRepositoryTrend(`${owner}/${name}`);

  if (!data) {
    notFound();
  }

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.detail}</p>
        <h1>{data.fullName}</h1>
        <p>{data.description ?? dictionary.misc.noData}</p>
      </section>
      <section className="content-card">
        <h2>{dictionary.sections.history}</h2>
        <div className="archive-list">
          {data.starDailyStats.slice(-30).map((item) => (
            <div key={item.date} className="archive-item">
              <span>{item.date}</span>
              <strong>+{item.starsAdded}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="content-card">
        <h2>{dictionary.sections.rankings}</h2>
        <div className="archive-list">
          {data.rankings.map((item) => (
            <div key={item.weekKey} className="archive-item">
              <span>{item.weekKey}</span>
              <strong>#{item.rank}</strong>
              <span>+{item.starDelta7d}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
