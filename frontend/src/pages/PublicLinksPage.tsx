import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { ApiError, type LinkShortSchema } from "../api/types";
import EmptyState from "../components/EmptyState";
import LinkCard from "../components/LinkCard";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";

const PAGE_LIMIT = 10;

export default function PublicLinksPage() {
  const loadedRef = useRef(false);
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  async function loadPublic(nextOffset = 0, append = false) {
    setError("");
    append ? setIsLoadingMore(true) : setIsLoading(true);

    try {
      const response = await api.getPublicLinks(PAGE_LIMIT, nextOffset);
      setLinks((current) => (append ? [...current, ...response.items] : response.items));
      setTotal(response.total);
      setOffset(response.offset + response.items.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить публичные ссылки.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }
    loadedRef.current = true;
    void loadPublic();
  }, []);

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage("Ссылка скопирована.");
  }

  const canLoadMore = links.length < total;

  return (
    <section className="stack-xl">
      <div className="dashboard-hero public-hero">
        <div>
          <p className="eyebrow">Общая лента</p>
          <h1>Публичные ссылки</h1>
          <p>Здесь отображаются ссылки, созданные без авторизации и без привязки к аккаунту.</p>
        </div>
        <div className="hero-stat">
          <span>Всего</span>
          <strong>{total}</strong>
        </div>
      </div>

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {error && <Message type="error">{error}</Message>}

      {isLoading ? (
        <LoadingState label="Загружаю публичные ссылки..." />
      ) : links.length ? (
        <>
          <div className="cards-grid">
            {links.map((link) => (
              <LinkCard key={link.short_url} link={link} onCopy={copyLink} showAnalytics={false} />
            ))}
          </div>
          {canLoadMore && (
            <div className="load-more-row">
              <button disabled={isLoadingMore} onClick={() => void loadPublic(offset, true)} type="button">
                {isLoadingMore ? "Загружаю..." : "Показать ещё"}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          description="Когда кто-то создаст публичную ссылку, она появится здесь."
          title="Публичных ссылок пока нет"
        />
      )}
    </section>
  );
}
