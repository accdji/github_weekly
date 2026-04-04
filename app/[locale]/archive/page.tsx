import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getWeeklyArchive } from "@/lib/archive";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ArchivePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const archive = await getWeeklyArchive();

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.archive}</p>
        <h1>{dictionary.pages.archive.title}</h1>
        <p>{dictionary.pages.archive.intro}</p>
      </section>
      <section className="archive-grid">
        {archive.map((week) => (
          <article key={week.weekKey} className="content-card">
            <h2>{week.weekKey}</h2>
            <div className="archive-list">
              {week.top.map((item) => (
                <a key={`${week.weekKey}-${item.fullName}`} href={item.htmlUrl} target="_blank" rel="noreferrer" className="archive-item">
                  <span>#{item.rank}</span>
                  <strong>{item.fullName}</strong>
                  <span>+{item.starDelta7d}</span>
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
