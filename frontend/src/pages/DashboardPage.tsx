import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { LinkSchema, LinkShortSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
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

const PAGE_LIMIT = 10;

export default function DashboardPage() {
  const { t } = useI18n();
  usePageTitle("pageTitles.dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as { message?: string } | null;
  const currentPage = parsePage(searchParams.get("page"));
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [deletingLink, setDeletingLink] = useState<LinkShortSchema | null>(null);
  const [editingLink, setEditingLink] = useState<LinkShortSchema | null>(null);
  const rateLimit = useRateLimitCooldown();

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

  useEffect(() => {
    if (state?.message) {
      setSuccessMessage(state.message);
      navigate(`${location.pathname}${location.search}`, { replace: true });
    }

    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    void loadLinks(currentPage);
  }, [currentPage, location.pathname, location.search, navigate, state?.message]);

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
    setEditingLink(null);
    setSuccessMessage(t("editLink.saved"));
  }

  function handleLinkDeleted(shortUrl: string) {
    setDeletingLink(null);
    setSuccessMessage(t("deleteLink.deleted"));

    const remainingLinks = links.filter((link) => link.short_url !== shortUrl);
    if (remainingLinks.length === 0 && currentPage > 1) {
      handlePageChange(currentPage - 1);
      return;
    }

    void loadLinks(currentPage);
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
          <LinkForm mode="private" onCreated={() => void loadLinks(currentPage)} />
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
      ) : links.length ? (
        <>
          {isLoading && <div className="pagination-loading">{t("common.loading")}</div>}
          <div className={isLoading ? "cards-grid cards-grid-loading" : "cards-grid"}>
            {links.map((link) => (
              <LinkCard
                key={link.short_url}
                link={link}
                onCopy={copyLink}
                onDelete={setDeletingLink}
                onEdit={setEditingLink}
              />
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
          action={
            <button onClick={() => setShowQuickCreate(true)} type="button">
              {t("dashboard.createFirst")}
            </button>
          }
          description={currentPage > 1 ? t("common.noLinksOnPage") : t("dashboard.emptyDescription")}
          title={currentPage > 1 ? t("common.noLinksOnPage") : t("dashboard.emptyTitle")}
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
