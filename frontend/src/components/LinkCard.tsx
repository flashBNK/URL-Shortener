import { Link } from "react-router-dom";
import { publicBaseUrl } from "../api/client";
import type { LinkShortSchema } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";
import { formatDate } from "../utils/formatters";

type LinkCardProps = {
  link: LinkShortSchema;
  onCopy: (value: string) => void;
  onDelete?: (link: LinkShortSchema) => void;
  onEdit?: (link: LinkShortSchema) => void;
  isPublic?: boolean;
  showOriginal?: boolean;
  showAnalytics?: boolean;
};

export default function LinkCard({
  link,
  onCopy,
  onDelete,
  onEdit,
  isPublic = false,
  showOriginal = false,
  showAnalytics = true,
}: LinkCardProps) {
  const { language, t } = useI18n();
  const shortLink = `${publicBaseUrl}/${link.short_url}`;
  const expiresAt = link.expires_at ? formatDate(link.expires_at, language) : "";
  const isExpired = Boolean(link.expires_at && new Date(link.expires_at).getTime() <= Date.now());

  return (
    <article className="link-card">
      <div className="link-card-top">
        <div>
          <p className="card-kicker">/{link.short_url}</p>
          <a className="link-card-title" href={shortLink} rel="noreferrer" target="_blank">
            {shortLink}
          </a>
        </div>
        <div className="link-card-badges">
          {isPublic && <span className="status-pill status-public">{t("common.public")}</span>}
          <span className={link.is_active && !isExpired ? "status-pill status-active" : "status-pill status-inactive"}>
            {isExpired ? t("linkCard.expired") : link.is_active ? t("common.active") : t("common.inactive")}
          </span>
        </div>
      </div>

      <p className="link-card-url">{link.url}</p>

      <div className="link-card-meta">
        <span>{t("common.clickCount", { count: link.total })}</span>
        <span>{expiresAt ? t("linkCard.expires", { date: expiresAt }) : t("linkCard.noExpiry")}</span>
      </div>

      <div className="actions-row">
        <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
          {t("common.open")}
        </a>
        <button className="secondary-button" onClick={() => onCopy(shortLink)} type="button">
          {t("common.copy")}
        </button>
        {showOriginal && (
          <a className="ghost-button" href={link.url} rel="noreferrer" target="_blank">
            {t("common.openOriginal")}
          </a>
        )}
        {onEdit && (
          <button className="secondary-button" onClick={() => onEdit(link)} type="button">
            {t("common.edit")}
          </button>
        )}
        {onDelete && (
          <button className="danger-button subtle" onClick={() => onDelete(link)} type="button">
            {t("common.delete")}
          </button>
        )}
        {showAnalytics && (
          <Link className="ghost-button" to={`/links/${link.short_url}`}>
            {t("common.analytics")}
          </Link>
        )}
      </div>
    </article>
  );
}
