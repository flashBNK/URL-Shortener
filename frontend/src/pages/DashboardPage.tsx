import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";

export default function DashboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { message?: string } | null;
  const loadedRef = useRef(false);
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [deletingLink, setDeletingLink] = useState<LinkShortSchema | null>(null);
  const [editingLink, setEditingLink] = useState<LinkShortSchema | null>(null);

  async function loadLinks() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.getMyLinks(30, 0);
      setLinks(response.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "errors.loadLinks", t));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (state?.message) {
      setSuccessMessage(state.message);
      navigate(location.pathname, { replace: true });
    }

    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (loadedRef.current) {
      return;
    }
    loadedRef.current = true;
    void loadLinks();
  }, [location.pathname, navigate, state?.message]);

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
    setLinks((current) => current.filter((link) => link.short_url !== shortUrl));
    setDeletingLink(null);
    setSuccessMessage(t("deleteLink.deleted"));
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
          <LinkForm mode="private" onCreated={() => void loadLinks()} />
        </section>
      )}

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {successMessage && <Message type="success">{successMessage}</Message>}
      {error && <Message type="error">{error}</Message>}

      {isLoading ? (
        <LoadingState label={t("dashboard.loading")} />
      ) : links.length ? (
        <div className="cards-grid">
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
      ) : (
        <EmptyState
          action={
            <button onClick={() => setShowQuickCreate(true)} type="button">
              {t("dashboard.createFirst")}
            </button>
          }
          description={t("dashboard.emptyDescription")}
          title={t("dashboard.emptyTitle")}
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
