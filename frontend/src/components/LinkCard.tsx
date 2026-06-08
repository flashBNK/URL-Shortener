import { Link } from "react-router-dom";
import { publicBaseUrl } from "../api/client";
import type { LinkShortSchema } from "../api/types";

type LinkCardProps = {
  link: LinkShortSchema;
  onCopy: (value: string) => void;
  showAnalytics?: boolean;
};

export default function LinkCard({ link, onCopy, showAnalytics = true }: LinkCardProps) {
  const shortLink = `${publicBaseUrl}/${link.short_url}`;

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
          {link.is_active ? "active" : "inactive"}
        </span>
      </div>

      <p className="link-card-url">{link.url}</p>

      <div className="link-card-meta">
        <span>
          <strong>{link.total}</strong> переходов
        </span>
        <span>{link.expires_at ? `Истекает ${new Date(link.expires_at).toLocaleDateString()}` : "Без срока"}</span>
      </div>

      <div className="actions-row">
        <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
          Открыть
        </a>
        <button className="secondary-button" onClick={() => onCopy(shortLink)} type="button">
          Копировать
        </button>
        {showAnalytics && (
          <Link className="ghost-button" to={`/links/${link.short_url}`}>
            Аналитика
          </Link>
        )}
      </div>
    </article>
  );
}
