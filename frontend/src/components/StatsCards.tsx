import type { LinkSchema } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";
import { formatDate } from "../utils/formatters";

type StatsCardsProps = {
  link: LinkSchema;
  ownerName?: string | null;
};

export default function StatsCards({ link, ownerName }: StatsCardsProps) {
  const { language, t } = useI18n();
  const owner = link.user_id ? (ownerName ?? t("common.notSpecified")) : t("stats.ownerPublic");

  return (
    <div className="stats-grid">
      <article className="stat-card">
        <span>{t("common.clicks")}</span>
        <strong>{link.total}</strong>
      </article>
      <article className="stat-card">
        <span>{t("common.status")}</span>
        <strong>{link.is_active ? t("common.active") : t("common.inactive")}</strong>
      </article>
      <article className="stat-card">
        <span>{t("stats.owner")}</span>
        <strong>{owner}</strong>
      </article>
      <article className="stat-card">
        <span>{t("stats.expiresAt")}</span>
        <strong>{link.expires_at ? formatDate(link.expires_at, language) : t("stats.noExpiry")}</strong>
      </article>
    </div>
  );
}
