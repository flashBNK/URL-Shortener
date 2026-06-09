import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { LinkSchema, LinkShortSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import EmptyState from "../components/EmptyState";
import LinkCard from "../components/LinkCard";
import LinkForm from "../components/LinkForm";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import Pagination from "../components/Pagination";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";

const PAGE_LIMIT = 10;
const SEARCH_BATCH_LIMIT = 100;

export default function PublicLinksPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parsePage(searchParams.get("page"));
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allLinksForSearch, setAllLinksForSearch] = useState<LinkShortSchema[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const authenticated = isAuthenticated();
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = Boolean(normalizedSearchQuery);
  const searchSourceLinks = isSearching ? allLinksForSearch : links;
  const filteredLinks = isSearching
    ? searchSourceLinks.filter(
        (link) => link.short_url.toLowerCase().includes(normalizedSearchQuery) || link.url.toLowerCase().includes(normalizedSearchQuery),
      )
    : links;
  const visibleLinks = isSearching
    ? filteredLinks.slice((currentPage - 1) * PAGE_LIMIT, currentPage * PAGE_LIMIT)
    : filteredLinks;
  const visibleTotal = isSearching ? filteredLinks.length : total;

  async function loadPublic(page = currentPage) {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.getPublicLinks(PAGE_LIMIT, (page - 1) * PAGE_LIMIT);
      setLinks(response.items);
      setTotal(response.total);
      if (!isSearching) {
        setAllLinksForSearch([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "errors.loadLinksPage", t));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPublic(currentPage);
  }, [currentPage]);

  useEffect(() => {
    async function loadAllPublicLinksForSearch() {
      if (!isSearching) {
        setAllLinksForSearch([]);
        setIsSearchLoading(false);
        return;
      }

      setError("");
      setIsSearchLoading(true);

      try {
        const firstResponse = await api.getPublicLinks(SEARCH_BATCH_LIMIT, 0);
        const nextLinks = [...firstResponse.items];

        for (let offset = firstResponse.items.length; offset < firstResponse.total; offset += SEARCH_BATCH_LIMIT) {
          const response = await api.getPublicLinks(SEARCH_BATCH_LIMIT, offset);
          nextLinks.push(...response.items);
        }

        setAllLinksForSearch(nextLinks);
        setTotal(firstResponse.total);
      } catch (err) {
        setAllLinksForSearch([]);
        setError(getApiErrorMessage(err, "errors.loadPublicLinks", t));
      } finally {
        setIsSearchLoading(false);
      }
    }

    void loadAllPublicLinksForSearch();
  }, [isSearching, t]);

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

  function handlePublicCreated(_link: LinkSchema) {
    setSuccessMessage(t("publicLinks.created"));
    setSearchQuery("");

    if (currentPage !== 1) {
      handlePageChange(1);
      return;
    }

    void loadPublic(1);
  }

  return (
    <section className="stack-xl">
      <div className="dashboard-hero public-hero">
        <div>
          <p className="eyebrow">{t("publicLinks.heroEyebrow")}</p>
          <h1>{t("publicLinks.heroTitle")}</h1>
          <p>{t("publicLinks.heroDescription")}</p>
          <div className="hero-actions">
            <Link className="primary-link-button" to={authenticated ? "/dashboard" : "/login"}>
              {authenticated ? t("publicLinks.dashboardCta") : t("publicLinks.loginCta")}
            </Link>
          </div>
        </div>
        <div className="hero-stat">
          <span>{t("common.total")}</span>
          <strong>{total}</strong>
        </div>
      </div>

      <section className="panel-section public-create-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("linkForm.publicLink")}</p>
            <h2>{t("publicLinks.createTitle")}</h2>
          </div>
          {authenticated && (
            <Link className="ghost-button" to="/dashboard">
              {t("publicLinks.createPrivate")}
            </Link>
          )}
        </div>
        <p className="helper-text">{t("publicLinks.publicHint")}</p>
        <LinkForm mode="anonymous" onCreated={handlePublicCreated} />
      </section>

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {successMessage && <Message type="success">{successMessage}</Message>}
      {error && <Message type="error">{error}</Message>}

      <section className="public-list-panel">
        <div className="public-toolbar">
          <label>
            <span>{isSearching ? t("publicLinks.searchLabelAll") : t("publicLinks.searchLabel")}</span>
            <input
              onChange={(event) => {
                setSearchQuery(event.target.value);
                handlePageChange(1);
              }}
              placeholder={t("publicLinks.searchPlaceholder")}
              type="search"
              value={searchQuery}
            />
          </label>
          {searchQuery && (
            <button className="secondary-button" onClick={() => setSearchQuery("")} type="button">
              {t("common.clear")}
            </button>
          )}
        </div>
      </section>

      {isLoading && links.length === 0 ? (
        <LoadingState label={t("publicLinks.loading")} />
      ) : error && links.length === 0 ? (
        <EmptyState
          action={
            <button onClick={() => void loadPublic(currentPage)} type="button">
              {t("common.retry")}
            </button>
          }
          description={t("errors.loadPublicLinks")}
          title={t("errors.loadLinksPage")}
        />
      ) : links.length && visibleLinks.length ? (
        <>
          {(isLoading || isSearchLoading) && <div className="pagination-loading">{t("common.loading")}</div>}
          <div className={isLoading || isSearchLoading ? "cards-grid cards-grid-loading" : "cards-grid"}>
            {visibleLinks.map((link) => (
              <LinkCard
                key={link.short_url}
                link={link}
                isPublic
                onCopy={copyLink}
                showAnalytics={false}
                showOriginal
              />
            ))}
          </div>
          <Pagination
            page={currentPage}
            limit={PAGE_LIMIT}
            total={visibleTotal}
            isLoading={isLoading || isSearchLoading}
            onPageChange={handlePageChange}
          />
        </>
      ) : links.length ? (
        <EmptyState
          action={
            <button onClick={() => setSearchQuery("")} type="button">
              {t("common.clear")}
            </button>
          }
          description={t("publicLinks.searchEmpty")}
          title={t("publicLinks.searchEmpty")}
        />
      ) : (
        <EmptyState
          action={
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button">
              {t("publicLinks.createFirst")}
            </button>
          }
          description={currentPage > 1 ? t("common.noLinksOnPage") : t("publicLinks.emptyDescription")}
          title={currentPage > 1 ? t("common.noLinksOnPage") : t("publicLinks.emptyTitle")}
        />
      )}

      {!isLoading && links.length === 0 && total > 0 && (
        <Pagination
          page={currentPage}
          limit={PAGE_LIMIT}
          total={visibleTotal}
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
