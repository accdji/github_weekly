import { notFound } from "next/navigation";
import { DashboardApp } from "@/components/dashboard-app";
import { getDashboardData } from "@/lib/dashboard";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const initialData = await getDashboardData({ range: "week" });

  return <DashboardApp locale={currentLocale} dictionary={dictionary} initialData={initialData} />;
}
