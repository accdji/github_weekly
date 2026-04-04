import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BoardsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }
  redirect(`/${locale}/collections`);
}
