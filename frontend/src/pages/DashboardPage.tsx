import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { LinkSchema, LinkShortSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import DashboardFilters from "../components/DashboardFilters";
import DeleteLinkModal from "../components/DeleteLinkModal";
import EditLinkModal from "../components/EditLinkModal";
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

export default function DashboardPage() {
  const { t } = useI18n();
  usePageTitle("pageTitles.dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as { message?: string } | null;
  const currentPage = parsePage(searchParams.get("page"));
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [allLinks, setAllLinks] = useState<LinkShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [deletingLink, setDeletingLink] = useState<LinkShortSchema | null>(null);
  const [editingLink, setEditingLink] = useState<LinkShortSchema | null>(null);
  const [filters, setFilters] = useState<DashboardFiltersState>(defaultDashboardFilters);
  const rateLimit = useRateLimitCooldown();
  const hasActiveFilters = !isDashboardFiltersDefault(filters);
  const filterSourceLinks = hasActiveFilters ? allLinks : links;
  const filteredLinks = getFilteredDashboardLinks(filterSourceLinks, filters);
  const visibleLinks = hasActiveFilters
    ? filteredLinks.slice((currentPage - 1) * PAGE_LIMIT, currentPage * PAGE_LIMIT)
    : filteredLinks;
  const paginationTotal = hasActiveFilters ? filteredLinks.length : total;
  const pageSourceCount = hasActiveFilters ? allLinks.length : links.length;
  const hasLoadedLinks = hasActiveFilters ? total > 0 || allLinks.length > 0 || isFilterLoading : links.length > 0;

  async function loadLinks(page = currentPage) {
    setError("");
    rateLimit.resetCooldown();
    setIsLoading(true);

    try {
      const response = await api.getMyLinks(PAGE_LIMIT, (page - 1) * PAGE_LIMIT);
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

  async function loadAllLinksForFilters() {
    setError("");
    rateLimit.resetCooldown();
    setIsFilterLoading(true);

    try {
      const firstResponse = await api.getMyLinks(FILTER_BATCH_LIMIT, 0);
      const nextLinks = [...firstResponse.items];

      for (let offset = firstResponse.items.length; offset < firstResponse.total; offset += FILTER_BATCH_LIMIT) {
        const response = await api.getMyLinks(FILTER_BATCH_LIMIT, offset);
        nextLinks.push(...response.items);
      }

      setAllLinks(nextLinks);
      setTotal(firstResponse.total);
    } catch (err) {
      if (rateLimit.startCooldown(err)) {
        return;
      }

      setError(getApiErrorMessage(err, "errors.loadLinksPage", t));
    } finally {
      setIsFilterLoading(false);
    }
  }

  useEffect(() => {
    if (state?.message) {
      setSuccessMessage(state.message);
      navigate(`${location.pathname}${location.search}`, { replace: true });
    }

    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (hasActiveFilters) {
      if (allLinks.length === 0 || (total > 0 && allLinks.length !== total)) {
        void loadAllLinksForFilters();
      }
      return;
    }

    void loadLinks(currentPage);
  }, [currentPage, hasActiveFilters, location.pathname, location.search, navigate, state?.message]);

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

  function handleLinkSaved(updatedLink: LinkSchema) {
    setLinks((current) =>
      current.map((link) =>
        link.short_url === editingLink?.short_url
          ? {
              url: updatedLink.url,
              short_url: updatedLink.short_url,
              total: updatedLink.total,
              is_active: updatedLink.is_active,
              expires_at: updatedLink.expires_at,
            }
          : link,
      ),
    );
    setAllLinks((current) =>
      current.map((link) =>
        link.short_url === editingLink?.short_url
          ? {
              url: updatedLink.url,
              short_url: updatedLink.short_url,
              total: updatedLink.total,
              is_active: updatedLink.is_active,
              expires_at: updatedLink.expires_at,
            }
          : link,
      ),
    );
    setEditingLink(null);
    setSuccessMessage(t("editLink.saved"));
  }

  function handleLinkDeleted(shortUrl: string) {
    setDeletingLink(null);
    setSuccessMessage(t("deleteLink.deleted"));
    setLinks((current) => current.filter((link) => link.short_url !== shortUrl));
    setAllLinks((current) => current.filter((link) => link.short_url !== shortUrl));
    setTotal((current) => Math.max(0, current - 1));

    const remainingLinks = hasActiveFilters
      ? visibleLinks.filter((link) => link.short_url !== shortUrl)
      : links.filter((link) => link.short_url !== shortUrl);
    if (remainingLinks.length === 0 && currentPage > 1) {
      handlePageChange(currentPage - 1);
      return;
    }

    void loadLinks(currentPage);
    if (hasActiveFilters) {
      void loadAllLinksForFilters();
    }
  }

  return (
    <section className="stack-xl">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">{t("dashboard.heroEyebrow")}</p>
          <h1>{t("dashboard.heroTitle")}</h1>
          <p>{t("dashboard.heroDescription")}</p>
        </div>
        <button onClick={() => setShowQuickCreate((value) => !value)} type="button">
          {showQuickCreate ? t("common.hideForm") : t("dashboard.newLink")}
        </button>
      </div>

      {showQuickCreate && (
        <section className="panel-section">
          <h2>{t("dashboard.quickCreate")}</h2>
          <LinkForm
            mode="private"
            onCreated={() => {
              void loadLinks(currentPage);
              if (hasActiveFilters) {
                void loadAllLinksForFilters();
              }
            }}
          />
        </section>
      )}

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {successMessage && <Message type="success">{successMessage}</Message>}
      {rateLimit.hasRateLimit && (
        <RateLimitNotice />
      )}
      {error && <Message type="error">{error}</Message>}

      {isLoading && links.length === 0 ? (
        <LoadingState label={t("dashboard.loading")} />
      ) : hasLoadedLinks ? (
        <>
          <DashboardFilters
            filters={filters}
            foundCount={filteredLinks.length}
            isGlobal={hasActiveFilters}
            pageCount={pageSourceCount}
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
                  onCopy={copyLink}
                  onDelete={setDeletingLink}
                  onEdit={setEditingLink}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <button onClick={resetFilters} type="button">
                  {t("dashboardFilters.resetFilters")}
                </button>
              }
              description={t("dashboardFilters.emptyDescription")}
              title={t("dashboardFilters.emptyTitle")}
            />
          )}
          <Pagination
            page={currentPage}
            limit={PAGE_LIMIT}
            total={paginationTotal}
            isLoading={isLoading || isFilterLoading}
            onPageChange={handlePageChange}
          />
        </>
      ) : total === 0 || !hasActiveFilters ? (
        <EmptyState
          action={
            <button onClick={() => setShowQuickCreate(true)} type="button">
              {t("dashboard.createFirst")}
            </button>
          }
          description={currentPage > 1 ? t("common.noLinksOnPage") : t("dashboard.emptyDescription")}
          title={currentPage > 1 ? t("common.noLinksOnPage") : t("dashboard.emptyTitle")}
        />
      ) : (
        <EmptyState
          action={
            <button onClick={resetFilters} type="button">
              {t("dashboardFilters.resetFilters")}
            </button>
          }
          description={t("dashboardFilters.emptyDescription")}
          title={t("dashboardFilters.emptyTitle")}
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

      <div className="helper-panel">
        <strong>{t("dashboard.helperTitle")}</strong>
        <span>{t("dashboard.helperDescription")}</span>
        <Link to="/public">{t("header.publicLinks")}</Link>
      </div>

      {editingLink && (
        <EditLinkModal link={editingLink} onClose={() => setEditingLink(null)} onSaved={handleLinkSaved} />
      )}
      {deletingLink && (
        <DeleteLinkModal link={deletingLink} onClose={() => setDeletingLink(null)} onDeleted={handleLinkDeleted} />
      )}
    </section>
  );
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
