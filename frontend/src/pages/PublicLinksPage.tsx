import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { LinkShortSchema } from "../api/types";
import EmptyState from "../components/EmptyState";
import LinkCard from "../components/LinkCard";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";

const PAGE_LIMIT = 10;

export default function PublicLinksPage() {
  const { t } = useI18n();
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
      setError(getApiErrorMessage(err, "errors.loadPublicLinks", t));
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
    setCopyMessage(t("common.copied"));
  }

  const canLoadMore = links.length < total;

  return (
    <section className="stack-xl">
      <div className="dashboard-hero public-hero">
        <div>
          <p className="eyebrow">{t("publicLinks.heroEyebrow")}</p>
          <h1>{t("publicLinks.heroTitle")}</h1>
          <p>{t("publicLinks.heroDescription")}</p>
        </div>
        <div className="hero-stat">
          <span>{t("common.total")}</span>
          <strong>{total}</strong>
        </div>
      </div>

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {error && <Message type="error">{error}</Message>}

      {isLoading ? (
        <LoadingState label={t("publicLinks.loading")} />
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
                {isLoadingMore ? t("publicLinks.loadingMore") : t("publicLinks.loadMore")}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          description={t("publicLinks.emptyDescription")}
          title={t("publicLinks.emptyTitle")}
        />
      )}
    </section>
  );
}
