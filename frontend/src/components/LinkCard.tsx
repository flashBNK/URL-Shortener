import { Link } from "react-router-dom";
import { publicBaseUrl } from "../api/client";
import type { LinkShortSchema } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";
import { formatDate } from "../utils/formatters";

type LinkCardProps = {
  link: LinkShortSchema;
  onCopy: (value: string) => void;
  showAnalytics?: boolean;
};

export default function LinkCard({ link, onCopy, showAnalytics = true }: LinkCardProps) {
  const { language, t } = useI18n();
  const shortLink = `${publicBaseUrl}/${link.short_url}`;
  const expiresAt = link.expires_at ? formatDate(link.expires_at, language) : "";

  return (
    <article className="link-card">
      <div className="link-card-top">
        <div>
          <p className="card-kicker">/{link.short_url}</p>
          <a className="link-card-title" href={shortLink} rel="noreferrer" target="_blank">
            {shortLink}
          </a>
        </div>
        <span className={link.is_active ? "status-pill status-active" : "status-pill status-inactive"}>
          {link.is_active ? t("common.active") : t("common.inactive")}
        </span>
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
        {showAnalytics && (
          <Link className="ghost-button" to={`/links/${link.short_url}`}>
            {t("common.analytics")}
          </Link>
        )}
      </div>
    </article>
  );
}
