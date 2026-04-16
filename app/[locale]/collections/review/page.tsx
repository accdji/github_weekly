import { notFound } from "next/navigation";
import { CollectionReviewPanel } from "@/components/collection-review-panel";
import { SiteHeader } from "@/components/site-header";
import { listCollectionSubmissions, listCollectionWorkspaces } from "@/lib/collection-submissions";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CollectionReviewPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const [submissions, workspaces] = await Promise.all([
    listCollectionSubmissions(),
    listCollectionWorkspaces(),
  ]);

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.boards}</p>
        <h1>{currentLocale === "zh-CN" ? "集合审核与策展工作台" : "Collection review and curation workspace"}</h1>
        <p>
          {currentLocale === "zh-CN"
            ? "这里集中处理社区提交、审核决定，以及多编辑协作分配。"
            : "This workspace centralizes community submissions, moderation decisions, and multi-editor assignments."}
        </p>
      </section>
      <CollectionReviewPanel locale={currentLocale} submissions={submissions} workspaces={workspaces} />
    </main>
  );
}
