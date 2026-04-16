import { notFound } from "next/navigation";
import { CollectionSubmissionForm } from "@/components/collection-submission-form";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CollectionSubmitPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);

  return (
    <main className="subpage-shell">
      <SiteHeader locale={currentLocale} />
      <section className="subpage-hero">
        <p className="eyebrow">{dictionary.sections.boards}</p>
        <h1>{currentLocale === "zh-CN" ? "提交新集合" : "Submit a new collection"}</h1>
        <p>
          {currentLocale === "zh-CN"
            ? "公开提交流程已经打通：提交后进入审核工作台，通过后自动创建集合并加入协作编辑流。"
            : "The public submission flow is now live: submissions enter the review workspace, and approved ones create collections automatically with editor access."}
        </p>
      </section>
      <CollectionSubmissionForm locale={currentLocale} />
    </main>
  );
}
