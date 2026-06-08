import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import { ApiError, type GroupByCountryLinkSchema, type LinkSchema, type ListLinkClicksSchema } from "../api/types";
import Charts from "../components/Charts";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import StatsCards from "../components/StatsCards";

export default function LinkDetailsPage() {
  const { shortUrl = "" } = useParams();
  const loadedRef = useRef("");
  const [link, setLink] = useState<LinkSchema | null>(null);
  const [stats, setStats] = useState<GroupByCountryLinkSchema | null>(null);
  const [clicks, setClicks] = useState<ListLinkClicksSchema | null>(null);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setError("");
      setStatsError("");
      setIsLoading(true);

      try {
        const linkResponse = await api.getLink(shortUrl);
        setLink(linkResponse);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Не удалось загрузить ссылку.");
        setIsLoading(false);
        return;
      }

      try {
        const [statsResponse, clicksResponse] = await Promise.all([api.getStats(shortUrl), api.getClicks(shortUrl)]);
        setStats(statsResponse);
        setClicks(clicksResponse);
      } catch {
        setStats(null);
        setClicks(null);
        setStatsError("Статистика доступна только владельцу ссылки.");
      } finally {
        setIsLoading(false);
      }
    }

    if (!shortUrl || loadedRef.current === shortUrl) {
      return;
    }

    loadedRef.current = shortUrl;
    void load();
  }, [shortUrl]);

  async function copyShortLink() {
    if (!link) {
      return;
    }
    await navigator.clipboard.writeText(`${publicBaseUrl}/${link.short_url}`);
    setCopyMessage("Короткая ссылка скопирована.");
  }

  if (isLoading) {
    return <LoadingState label="Загружаю детали ссылки..." />;
  }

  if (error) {
    return (
      <section className="narrow-page">
        <Message type="error">{error}</Message>
        <Link className="ghost-button" to="/dashboard">
          Вернуться в кабинет
        </Link>
      </section>
    );
  }

  if (!link) {
    return null;
  }

  const shortLink = `${publicBaseUrl}/${link.short_url}`;

  return (
    <section className="stack-xl">
      <div className="details-hero">
        <div>
          <p className="eyebrow">Аналитика ссылки</p>
          <h1>{link.short_url}</h1>
          <a href={shortLink} rel="noreferrer" target="_blank">
            {shortLink}
          </a>
          <p>{link.url}</p>
        </div>
        <div className="actions-row">
          <button className="secondary-button" onClick={copyShortLink} type="button">
            Копировать
          </button>
          <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
            Открыть
          </a>
          <Link className="ghost-button" to="/dashboard">
            Назад
          </Link>
        </div>
      </div>

      {copyMessage && <Message type="success">{copyMessage}</Message>}

      <StatsCards link={link} />

      {statsError && <Message type="info">{statsError}</Message>}

      <Charts stats={stats} />

      <section className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">События</p>
            <h2>Последние клики</h2>
          </div>
          <span className="muted">{clicks?.total ?? 0} всего</span>
        </div>

        {clicks?.items.length ? (
          <div className="click-table">
            <div className="click-table-head">
              <span>Дата</span>
              <span>Страна</span>
              <span>IP</span>
              <span>User-Agent</span>
            </div>
            {clicks.items.map((click) => (
              <div className="click-table-row" key={`${click.ip}-${click.clicked_at}`}>
                <span>{new Date(click.clicked_at).toLocaleString()}</span>
                <span>{click.country ?? "Неизвестно"}</span>
                <span>{click.ip}</span>
                <span>{click.user_agent ?? "Нет данных"}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            description="После первых переходов здесь появится список последних кликов."
            title="Кликов пока нет"
          />
        )}
      </section>
    </section>
  );
}
