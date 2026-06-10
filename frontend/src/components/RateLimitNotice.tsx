import { useI18n } from "../i18n/I18nProvider";

export default function RateLimitNotice() {
  const { t } = useI18n();

  return (
    <div className="rate-limit-notice">
      <div>
        <strong>{t("rateLimit.title")}</strong>
        <p>{t("rateLimit.tryLaterOrSignIn")}</p>
      </div>
    </div>
  );
}
