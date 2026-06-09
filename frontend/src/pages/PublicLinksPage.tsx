import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { LinkShortSchema } from "../api/types";
import EmptyState from "../components/EmptyState";
import LinkCard from "../components/LinkCard";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import Pagination from "../components/Pagination";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";

const PAGE_LIMIT = 10;

export default function PublicLinksPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parsePage(searchParams.get("page"));
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadPublic(page = currentPage) {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.getPublicLinks(PAGE_LIMIT, (page - 1) * PAGE_LIMIT);
      setLinks(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(getApiErrorMessage(err, "errors.loadLinksPage", t));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPublic(currentPage);
  }, [currentPage]);

  function handlePageChange(page: number) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(page));
    }
    setSearchParams(nextSearchParams);
  }

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage(t("common.copied"));
  }

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

      {isLoading && links.length === 0 ? (
        <LoadingState label={t("publicLinks.loading")} />
      ) : links.length ? (
        <>
          {isLoading && <div className="pagination-loading">{t("common.loading")}</div>}
          <div className={isLoading ? "cards-grid cards-grid-loading" : "cards-grid"}>
            {links.map((link) => (
              <LinkCard key={link.short_url} link={link} onCopy={copyLink} showAnalytics={false} />
            ))}
          </div>
          <Pagination
            page={currentPage}
            limit={PAGE_LIMIT}
            total={total}
            isLoading={isLoading}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState
          description={currentPage > 1 ? t("common.noLinksOnPage") : t("publicLinks.emptyDescription")}
          title={currentPage > 1 ? t("common.noLinksOnPage") : t("publicLinks.emptyTitle")}
        />
      )}

      {!isLoading && links.length === 0 && total > 0 && (
        <Pagination
          page={currentPage}
          limit={PAGE_LIMIT}
          total={total}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
