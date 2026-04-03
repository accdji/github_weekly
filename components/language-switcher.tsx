"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Locale, getDictionary, locales } from "@/lib/i18n";

function buildHref(pathname: string, searchParams: URLSearchParams, locale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0) {
    segments[0] = locale;
  } else {
    segments.push(locale);
  }

  const query = searchParams.toString();
  return `/${segments.join("/")}${query ? `?${query}` : ""}`;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const pathname = usePathname();
  const searchParams = new URLSearchParams(useSearchParams().toString());

  return (
    <div className="language-switcher" aria-label={dictionary.nav.languageLabel}>
      {locales.map((nextLocale) => (
        <a
          key={nextLocale}
          href={buildHref(pathname, searchParams, nextLocale)}
          className={`language-link${nextLocale === locale ? " is-active" : ""}`}
        >
          {dictionary.nav.locales[nextLocale]}
        </a>
      ))}
    </div>
  );
}
