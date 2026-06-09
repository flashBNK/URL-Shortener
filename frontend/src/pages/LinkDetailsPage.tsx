import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import {
  type GroupByCountryLinkSchema,
  type LinkSchema,
  type ListLinkClicksSchema,
  type UserSchema,
} from "../api/types";
import Charts from "../components/Charts";
import EditLinkModal from "../components/EditLinkModal";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import StatsCards from "../components/StatsCards";
import { isAuthenticated } from "../auth/tokenStore";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";
import { formatDateTime } from "../utils/formatters";
import { summarizeUserAgent } from "../utils/userAgent";

export default function LinkDetailsPage() {
  const { language, t } = useI18n();
  const { shortUrl = "" } = useParams();
  const navigate = useNavigate();
  const loadedRef = useRef("");
  const [link, setLink] = useState<LinkSchema | null>(null);
  const [stats, setStats] = useState<GroupByCountryLinkSchema | null>(null);
  const [clicks, setClicks] = useState<ListLinkClicksSchema | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSchema | null>(null);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function load() {
      setError("");
      setStatsError(false);
      setIsLoading(true);

      try {
        const linkResponse = await api.getLink(shortUrl);
        setLink(linkResponse);
      } catch (err) {
        setError(getApiErrorMessage(err, "errors.loadLink", t));
        setIsLoading(false);
        return;
      }

      try {
        const [statsResponse, clicksResponse, userResponse] = await Promise.all([
          api.getStats(shortUrl),
          api.getClicks(shortUrl),
          isAuthenticated() ? api.getMe().catch(() => null) : Promise.resolve(null),
        ]);
        setStats(statsResponse);
        setClicks(clicksResponse);
        setCurrentUser(userResponse);
      } catch {
        setStats(null);
        setClicks(null);
        setStatsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (!shortUrl || loadedRef.current === shortUrl) {
      return;
    }

    loadedRef.current = shortUrl;
    void load();
  }, [shortUrl, t]);

  async function copyShortLink() {
    if (!link) {
      return;
    }
    await navigator.clipboard.writeText(`${publicBaseUrl}/${link.short_url}`);
    setCopyMessage(t("common.copyShortLink"));
  }

  async function copyUserAgent(userAgent: string | null) {
    if (!userAgent) {
      return;
    }

    await navigator.clipboard.writeText(userAgent);
    setCopyMessage(t("details.userAgentCopied"));
  }

  function handleLinkSaved(updatedLink: LinkSchema) {
    const previousShortUrl = link?.short_url;
    setLink(updatedLink);
    setIsEditing(false);
    setSuccessMessage(t("editLink.saved"));

    if (previousShortUrl && updatedLink.short_url !== previousShortUrl) {
      loadedRef.current = "";
      navigate(`/links/${updatedLink.short_url}`, { replace: true });
    }
  }

  if (isLoading) {
    return <LoadingState label={t("details.detailsLoading")} />;
  }

  if (error) {
    return (
      <section className="narrow-page">
        <Message type="error">{error}</Message>
        <Link className="ghost-button" to="/dashboard">
          {t("details.returnDashboard")}
        </Link>
      </section>
    );
  }

  if (!link) {
    return null;
  }

  const shortLink = `${publicBaseUrl}/${link.short_url}`;
  const ownerName = currentUser && link.user_id === currentUser.id ? currentUser.username : null;
  const canEdit = Boolean(ownerName);

  return (
    <section className="stack-xl">
      <div className="details-hero">
        <div>
          <p className="eyebrow">{t("details.linkAnalytics")}</p>
          <h1>{link.short_url}</h1>
          <a href={shortLink} rel="noreferrer" target="_blank">
            {shortLink}
          </a>
          <p>{link.url}</p>
        </div>
        <div className="actions-row">
          <button className="secondary-button" onClick={copyShortLink} type="button">
            {t("common.copy")}
          </button>
          <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
            {t("common.open")}
          </a>
          {canEdit && (
            <button className="secondary-button" onClick={() => setIsEditing(true)} type="button">
              {t("common.edit")}
            </button>
          )}
          <Link className="ghost-button" to="/dashboard">
            {t("common.back")}
          </Link>
        </div>
      </div>

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {successMessage && <Message type="success">{successMessage}</Message>}

      <StatsCards link={link} ownerName={ownerName} />

      {statsError && <Message type="info">{t("errors.statsOwnerOnly")}</Message>}

      <Charts stats={stats} />

      <section className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("details.eventsEyebrow")}</p>
            <h2>{t("details.lastClicks")}</h2>
          </div>
          <span className="muted">{t("details.clicksTotal", { count: clicks?.total ?? 0 })}</span>
        </div>

        {clicks?.items.length ? (
          <div className="click-table">
            <div className="click-table-head">
              <span>{t("details.date")}</span>
              <span>{t("details.country")}</span>
              <span>{t("common.ip")}</span>
              <span>{t("common.userAgent")}</span>
            </div>
            {clicks.items.map((click) => (
              <div className="click-table-row" key={`${click.ip}-${click.clicked_at}`}>
                <span>{formatDateTime(click.clicked_at, language)}</span>
                <span>{click.country ?? t("details.unknownCountry")}</span>
                <span>{click.ip}</span>
                <span className="user-agent-cell" title={click.user_agent ?? t("details.noUserAgent")}>
                  <span>{click.user_agent ? summarizeUserAgent(click.user_agent) : t("details.noUserAgent")}</span>
                  {click.user_agent && (
                    <button
                      className="text-button"
                      onClick={() => void copyUserAgent(click.user_agent)}
                      type="button"
                    >
                      {t("common.copy")}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            description={t("details.clicksEmptyDescription")}
            title={t("details.clicksEmptyTitle")}
          />
        )}
      </section>

      {isEditing && <EditLinkModal link={link} onClose={() => setIsEditing(false)} onSaved={handleLinkSaved} />}
    </section>
  );
}
