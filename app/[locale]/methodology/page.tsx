import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getMethodologySections } from "@/lib/methodology";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MethodologyPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const sections = getMethodologySections(currentLocale);

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.methodology}</p>
        <h1>{dictionary.pages.methodology.title}</h1>
        <p>{dictionary.pages.methodology.intro}</p>
      </section>
      <section className="content-stack">
        {sections.map((section) => (
          <article key={section.title} className="content-card">
            <h2>{section.title}</h2>
            <ul className="content-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
