import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { LinkShortSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
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
  const loadedRef = useRef(false);
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

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
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (loadedRef.current) {
      return;
    }
    loadedRef.current = true;
    void loadLinks();
  }, [navigate]);

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage(t("common.copied"));
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
      {error && <Message type="error">{error}</Message>}

      {isLoading ? (
        <LoadingState label={t("dashboard.loading")} />
      ) : links.length ? (
        <div className="cards-grid">
          {links.map((link) => (
            <LinkCard key={link.short_url} link={link} onCopy={copyLink} />
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
    </section>
  );
}
