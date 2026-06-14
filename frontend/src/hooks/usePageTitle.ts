import { useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";

export function usePageTitle(titleKey: TranslationKey) {
  const { language, t } = useI18n();

  useEffect(() => {
    const brand = language === "ru" ? t("pageTitles.brandRu") : t("pageTitles.brandEn");
    document.title = `${t(titleKey)} · ${brand}`;
  }, [language, t, titleKey]);
}
