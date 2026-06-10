import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { LinkSchema, LinkShortSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import DashboardFilters from "../components/DashboardFilters";
import EmptyState from "../components/EmptyState";
import LinkCard from "../components/LinkCard";
import LinkForm from "../components/LinkForm";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import Pagination from "../components/Pagination";
import RateLimitNotice from "../components/RateLimitNotice";
import { usePageTitle } from "../hooks/usePageTitle";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";
import {
  defaultDashboardFilters,
  getFilteredDashboardLinks,
  isDashboardFiltersDefault,
  type DashboardFiltersState,
} from "../utils/linkFilters";

const PAGE_LIMIT = 10;
const FILTER_BATCH_LIMIT = 100;

export default function PublicLinksPage() {
  const { t } = useI18n();
  usePageTitle("pageTitles.publicLinks");
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parsePage(searchParams.get("page"));
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filters, setFilters] = useState<DashboardFiltersState>(defaultDashboardFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [allLinks, setAllLinks] = useState<LinkShortSchema[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const rateLimit = useRateLimitCooldown();
  const authenticated = isAuthenticated();
  const hasActiveFilters = !isDashboardFiltersDefault(filters);
  const filterSourceLinks = hasActiveFilters ? allLinks : links;
  const filteredLinks = getFilteredDashboardLinks(filterSourceLinks, filters);
  const visibleLinks = hasActiveFilters
    ? filteredLinks.slice((currentPage - 1) * PAGE_LIMIT, currentPage * PAGE_LIMIT)
    : filteredLinks;
  const visibleTotal = hasActiveFilters ? filteredLinks.length : total;
  const sourceCount = hasActiveFilters ? allLinks.length : links.length;
  const hasLoadedLinks = hasActiveFilters ? total > 0 || allLinks.length > 0 || isFilterLoading : links.length > 0;

  async function loadPublic(page = currentPage) {
    setError("");
    rateLimit.resetCooldown();
    setIsLoading(true);

    try {
      const response = await api.getPublicLinks(PAGE_LIMIT, (page - 1) * PAGE_LIMIT);
      setLinks(response.items);
      setTotal(response.total);
    } catch (err) {
      if (rateLimit.startCooldown(err)) {
        return;
      }

      setError(getApiErrorMessage(err, "errors.loadLinksPage", t));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAllPublicLinksForFilters() {
    setError("");
    rateLimit.resetCooldown();
    setIsFilterLoading(true);

    try {
      const firstResponse = await api.getPublicLinks(FILTER_BATCH_LIMIT, 0);
      const nextLinks = [...firstResponse.items];

      for (let offset = firstResponse.items.length; offset < firstResponse.total; offset += FILTER_BATCH_LIMIT) {
        const response = await api.getPublicLinks(FILTER_BATCH_LIMIT, offset);
        nextLinks.push(...response.items);
      }

      setAllLinks(nextLinks);
      setTotal(firstResponse.total);
    } catch (err) {
      if (rateLimit.startCooldown(err)) {
        return;
      }

      setError(getApiErrorMessage(err, "errors.loadPublicLinks", t));
    } finally {
      setIsFilterLoading(false);
    }
  }

  useEffect(() => {
    if (hasActiveFilters) {
      if (allLinks.length === 0 || (total > 0 && allLinks.length !== total)) {
        void loadAllPublicLinksForFilters();
      }
      return;
    }

    void loadPublic(currentPage);
  }, [currentPage, hasActiveFilters, t]);

  function handlePageChange(page: number) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      nextSearchParams.delete("page");
    } else {
      nextSearchParams.set("page", String(page));
    }
    setSearchParams(nextSearchParams);
  }

  function handleFiltersChange(nextFilters: DashboardFiltersState) {
    setFilters(nextFilters);

    if (currentPage !== 1) {
      handlePageChange(1);
    }
  }

  function resetFilters() {
    setFilters(defaultDashboardFilters);

    if (currentPage !== 1) {
      handlePageChange(1);
    }
  }

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage(t("common.copied"));
  }

  function handlePublicCreated(_link: LinkSchema) {
    setSuccessMessage(t("publicLinks.created"));
    setFilters(defaultDashboardFilters);
    setAllLinks([]);

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
      {rateLimit.hasRateLimit && (
        <RateLimitNotice />
      )}
      {error && <Message type="error">{error}</Message>}

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
      ) : hasLoadedLinks ? (
        <>
          <DashboardFilters
            filters={filters}
            foundCount={filteredLinks.length}
            isGlobal={hasActiveFilters}
            labels="publicFilters"
            pageCount={sourceCount}
            onChange={handleFiltersChange}
            onReset={resetFilters}
          />
          {(isLoading || isFilterLoading) && <div className="pagination-loading">{t("common.loading")}</div>}
          {visibleLinks.length ? (
            <div className={isLoading || isFilterLoading ? "cards-grid cards-grid-loading" : "cards-grid"}>
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
          ) : (
            <EmptyState
              action={
                <button onClick={resetFilters} type="button">
                  {t("publicFilters.resetFilters")}
                </button>
              }
              description={t("publicFilters.emptyDescription")}
              title={t("publicFilters.emptyTitle")}
            />
          )}
          <Pagination
            page={currentPage}
            limit={PAGE_LIMIT}
            total={visibleTotal}
            isLoading={isLoading || isFilterLoading}
            onPageChange={handlePageChange}
          />
        </>
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
