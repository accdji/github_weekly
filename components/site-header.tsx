import { Locale, getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const collectionsLabel = locale === "zh-CN" ? "精选集合" : "Collections";
  const manualLabel = locale === "zh-CN" ? "产品手册" : "Product Manual";

  return (
    <header className="site-header">
      <div>
        <div className="brand-mark">{dictionary.nav.title}</div>
        <p className="brand-note">{dictionary.nav.subtitle}</p>
      </div>
      <nav className="site-nav">
        <a href={`/${locale}`}>{dictionary.nav.links.dashboard}</a>
        <a href={`/${locale}/archive`}>{dictionary.nav.links.archive}</a>
        <a href={`/${locale}/collections`}>{collectionsLabel}</a>
        <a href={`/${locale}/subscriptions`}>{dictionary.nav.links.subscriptions}</a>
        <a href={`/${locale}/methodology`}>{dictionary.nav.links.methodology}</a>
        <a href={`/${locale}/jobs`}>{dictionary.nav.links.jobs}</a>
        <a href={`/${locale}/ai`}>{manualLabel}</a>
      </nav>
      <LanguageSwitcher locale={locale} />
    </header>
  );
}
