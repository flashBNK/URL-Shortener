import { Link } from "react-router-dom";
import { publicBaseUrl } from "../api/client";
import type { LinkSchema } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";

type LinkResultCardProps = {
  link: LinkSchema;
  showDetails?: boolean;
  onCopy: (value: string) => void;
};

export default function LinkResultCard({ link, showDetails = true, onCopy }: LinkResultCardProps) {
  const { t } = useI18n();
  const shortLink = `${publicBaseUrl}/${link.short_url}`;

  return (
    <article className="result-card">
      <div>
        <p className="card-kicker">{t("result.ready")}</p>
        <h3>{link.short_url}</h3>
      </div>
      <div className="result-lines">
        <span>{t("result.original")}</span>
        <p>{link.url}</p>
        <span>{t("result.shortLink")}</span>
        <a href={shortLink} rel="noreferrer" target="_blank">
          {shortLink}
        </a>
      </div>
      <div className="actions-row">
        <button className="secondary-button" onClick={() => onCopy(shortLink)} type="button">
          {t("common.copy")}
        </button>
        <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
          {t("common.open")}
        </a>
        {showDetails && (
          <Link className="ghost-button" to={`/links/${link.short_url}`}>
            {t("common.details")}
          </Link>
        )}
      </div>
    </article>
  );
}
