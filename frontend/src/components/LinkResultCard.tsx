import { Link } from "react-router-dom";
import { publicBaseUrl } from "../api/client";
import type { LinkSchema } from "../api/types";

type LinkResultCardProps = {
  link: LinkSchema;
  showDetails?: boolean;
  onCopy: (value: string) => void;
};

export default function LinkResultCard({ link, showDetails = true, onCopy }: LinkResultCardProps) {
  const shortLink = `${publicBaseUrl}/${link.short_url}`;

  return (
    <article className="result-card">
      <div>
        <p className="card-kicker">Ссылка готова</p>
        <h3>{link.short_url}</h3>
      </div>
      <div className="result-lines">
        <span>Оригинал</span>
        <p>{link.url}</p>
        <span>Короткая ссылка</span>
        <a href={shortLink} rel="noreferrer" target="_blank">
          {shortLink}
        </a>
      </div>
      <div className="actions-row">
        <button className="secondary-button" onClick={() => onCopy(shortLink)} type="button">
          Скопировать
        </button>
        <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
          Открыть
        </a>
        {showDetails && (
          <Link className="ghost-button" to={`/links/${link.short_url}`}>
            Подробнее
          </Link>
        )}
      </div>
    </article>
  );
}
