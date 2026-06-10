import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import {
  ApiError,
  type GroupByCountryLinkSchema,
  type LinkSchema,
  type ListLinkClicksSchema,
  type UserSchema,
} from "../api/types";
import Charts from "../components/Charts";
import DeleteLinkModal from "../components/DeleteLinkModal";
import EditLinkModal from "../components/EditLinkModal";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import Pagination from "../components/Pagination";
import RateLimitNotice from "../components/RateLimitNotice";
import StatsCards from "../components/StatsCards";
import { isAuthenticated } from "../auth/tokenStore";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";
import { getApiErrorMessage } from "../utils/apiErrors";
import { formatDateTime } from "../utils/formatters";
import { summarizeUserAgent } from "../utils/userAgent";

const CLICKS_PAGE_LIMIT = 10;

export default function LinkDetailsPage() {
  const { language, t } = useI18n();
  const { shortUrl = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentClicksPage = parsePage(searchParams.get("clicksPage"));
  const [link, setLink] = useState<LinkSchema | null>(null);
  const [stats, setStats] = useState<GroupByCountryLinkSchema | null>(null);
  const [clicks, setClicks] = useState<ListLinkClicksSchema | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSchema | null>(null);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState(false);
  const [clicksError, setClicksError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isClicksLoading, setIsClicksLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const detailsRateLimit = useRateLimitCooldown();
  const statsRateLimit = useRateLimitCooldown();
  const clicksRateLimit = useRateLimitCooldown();

  async function loadDetails() {
    setError("");
    setStatsError(false);
    detailsRateLimit.resetCooldown();
    statsRateLimit.resetCooldown();
    setIsLoading(true);
    setLink(null);
    setStats(null);
    setCurrentUser(null);

    try {
      const linkResponse = await api.getLink(shortUrl);
      setLink(linkResponse);

      if (linkResponse.user_id === null) {
        setIsLoading(false);
        return;
      }
    } catch (err) {
      if (detailsRateLimit.startCooldown(err)) {
        setIsLoading(false);
        return;
      }

      setError(getApiErrorMessage(err, "errors.loadLink", t));
      setIsLoading(false);
      return;
    }

    try {
      const [statsResponse, userResponse] = await Promise.all([
        api.getStats(shortUrl),
        isAuthenticated() ? api.getMe().catch(() => null) : Promise.resolve(null),
      ]);
      setStats(statsResponse);
      setCurrentUser(userResponse);
    } catch (err) {
      setStats(null);
      if (!statsRateLimit.startCooldown(err)) {
        setStatsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadClicks() {
    if (!shortUrl || !link) {
      return;
    }

    if (link?.user_id === null) {
      setClicks(null);
      setClicksError("");
      setIsClicksLoading(false);
      return;
    }

    setClicksError("");
    clicksRateLimit.resetCooldown();
    setIsClicksLoading(true);

    try {
      const response = await api.getClicks(
        shortUrl,
        CLICKS_PAGE_LIMIT,
        (currentClicksPage - 1) * CLICKS_PAGE_LIMIT,
      );

      if (response.items.length === 0 && response.total > 0 && currentClicksPage > 1) {
        handleClicksPageChange(currentClicksPage - 1);
        return;
      }

      setClicks(response);
    } catch (err) {
      setClicks(null);
      if (!clicksRateLimit.startCooldown(err)) {
        setClicksError(getClickHistoryErrorMessage(err, t));
      }
    } finally {
      setIsClicksLoading(false);
    }
  }

  useEffect(() => {
    if (!shortUrl) {
      return;
    }

    void loadDetails();
  }, [shortUrl, t]);

  useEffect(() => {
    void loadClicks();
  }, [shortUrl, currentClicksPage, link?.user_id, t]);

  if (detailsRateLimit.hasRateLimit && !link) {
    return (
      <section className="narrow-page">
        <RateLimitNotice />
      </section>
    );
  }

  function handleClicksPageChange(page: number) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      nextSearchParams.delete("clicksPage");
    } else {
      nextSearchParams.set("clicksPage", String(page));
    }
    setSearchParams(nextSearchParams);
  }

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
      navigate(`/links/${updatedLink.short_url}`, { replace: true });
    }
  }

  function handleLinkDeleted() {
    navigate("/dashboard", { state: { message: t("deleteLink.deleted") } });
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
  const isOwnLink = Boolean(currentUser && link.user_id === currentUser.id);
  const ownerName =
    currentUser && link.user_id === currentUser.id
      ? currentUser.username
      : link.user_id
        ? t("stats.personalOwner")
        : null;
  const canEdit = isOwnLink;

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

      {link.user_id === null ? (
        <EmptyState description={t("charts.publicChartsEmpty")} title={t("charts.publicChartsEmptyTitle")} />
      ) : statsRateLimit.hasRateLimit ? (
        <RateLimitNotice />
      ) : (
        <Charts stats={stats} />
      )}

      {isOwnLink && (
        <section className="danger-zone">
          <div>
            <p className="eyebrow">{t("deleteLink.dangerZone")}</p>
            <h2>{t("deleteLink.title")}</h2>
            <p>{t("deleteLink.description")}</p>
          </div>
          <button className="danger-button" onClick={() => setIsDeleting(true)} type="button">
            {t("common.delete")}
          </button>
        </section>
      )}

      <section className="panel-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("details.eventsEyebrow")}</p>
            <h2>{t("details.clickHistory")}</h2>
          </div>
          <span className="muted">{t("details.clicksTotal", { count: clicks?.total ?? 0 })}</span>
        </div>

        {clicksRateLimit.hasRateLimit && (
          <RateLimitNotice />
        )}
        {clicksError && <Message type="error">{clicksError}</Message>}

        {link.user_id === null ? (
          <EmptyState
            description={t("details.publicClickHistoryEmpty")}
            title={t("details.publicClickHistoryEmptyTitle")}
          />
        ) : clicksRateLimit.hasRateLimit ? null : !clicksError && isClicksLoading && !clicks ? (
          <LoadingState label={t("details.clickHistoryLoading")} />
        ) : !clicksError && clicks?.items.length ? (
          <>
            {isClicksLoading && <div className="pagination-loading">{t("common.loading")}</div>}
            <div className={isClicksLoading ? "click-table click-table-loading" : "click-table"}>
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
            <Pagination
              page={currentClicksPage}
              limit={CLICKS_PAGE_LIMIT}
              total={clicks.total}
              isLoading={isClicksLoading}
              onPageChange={handleClicksPageChange}
            />
          </>
        ) : !clicksError ? (
          <EmptyState
            description={currentClicksPage > 1 ? t("details.noClicksOnPage") : t("details.clicksEmptyDescription")}
            title={currentClicksPage > 1 ? t("details.noClicksOnPage") : t("details.clicksEmptyTitle")}
          />
        ) : null}

        {!isClicksLoading && !clicksError && clicks && clicks.items.length === 0 && clicks.total > 0 && (
          <Pagination
            page={currentClicksPage}
            limit={CLICKS_PAGE_LIMIT}
            total={clicks.total}
            isLoading={isClicksLoading}
            onPageChange={handleClicksPageChange}
          />
        )}
      </section>

      {isEditing && <EditLinkModal link={link} onClose={() => setIsEditing(false)} onSaved={handleLinkSaved} />}
      {isDeleting && (
        <DeleteLinkModal link={link} onClose={() => setIsDeleting(false)} onDeleted={handleLinkDeleted} />
      )}
    </section>
  );
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getClickHistoryErrorMessage(error: unknown, t: (key: TranslationKey) => string) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.code === "unauthorized")) {
    return t("details.clickHistoryOwnerOnly");
  }

  return getApiErrorMessage(error, "errors.loadClickHistory", t);
}
