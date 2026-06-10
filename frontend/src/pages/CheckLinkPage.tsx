import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import { ApiError, type LinkSchema } from "../api/types";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import RateLimitNotice from "../components/RateLimitNotice";
import { usePageTitle } from "../hooks/usePageTitle";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";
import { formatDateTime } from "../utils/formatters";
import { aliasPattern, maxAliasLength, minAliasLength } from "../utils/linkValidation";

type ParseResult =
  | {
      shortUrl: string;
      error: "";
    }
  | {
      shortUrl: "";
      error: "empty" | "spaces" | "format";
    };

function parseShortLinkInput(value: string): ParseResult {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { shortUrl: "", error: "empty" };
  }

  if (/\s/.test(trimmedValue)) {
    return { shortUrl: "", error: "spaces" };
  }

  let shortUrl = trimmedValue;

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)) {
    try {
      const parsedUrl = new URL(trimmedValue);
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
      shortUrl = pathSegments.at(-1) ?? "";
    } catch {
      return { shortUrl: "", error: "format" };
    }
  }

  shortUrl = shortUrl.replace(/^\/+/, "").replace(/\/+$/, "");

  if (!shortUrl) {
    return { shortUrl: "", error: "empty" };
  }

  if (
    shortUrl.includes("/") ||
    shortUrl.length < minAliasLength ||
    shortUrl.length > maxAliasLength ||
    !aliasPattern.test(shortUrl)
  ) {
    return { shortUrl: "", error: "format" };
  }

  return { shortUrl, error: "" };
}

export default function CheckLinkPage() {
  const { language, t } = useI18n();
  usePageTitle("pageTitles.check");
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("short") ?? "");
  const [link, setLink] = useState<LinkSchema | null>(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const lastRequestedShortUrlRef = useRef("");
  const rateLimit = useRateLimitCooldown();

  const shortLink = link ? `${publicBaseUrl}/${link.short_url}` : "";
  const isExpired = Boolean(link?.expires_at && new Date(link.expires_at).getTime() <= Date.now());
  const isUnavailable = Boolean(link && (!link.is_active || isExpired));

  useEffect(() => {
    const shortParam = searchParams.get("short") ?? "";
    setInputValue(shortParam);

    if (!shortParam) {
      setLink(null);
      setError("");
      setCopyMessage("");
      return;
    }

    const parsedInput = parseShortLinkInput(shortParam);
    if (parsedInput.error) {
      setLink(null);
      setError(getInputErrorMessage(parsedInput.error, t));
      return;
    }

    void checkShortUrl(parsedInput.shortUrl);
  }, [searchParams]);

  async function checkShortUrl(shortUrl: string) {
    lastRequestedShortUrlRef.current = shortUrl;
    setIsLoading(true);
    setError("");
    rateLimit.resetCooldown();
    setCopyMessage("");
    setLink(null);

    try {
      const checkedLink = await api.getLink(shortUrl);

      if (lastRequestedShortUrlRef.current === shortUrl) {
        setLink(checkedLink);
      }
    } catch (err) {
      if (lastRequestedShortUrlRef.current === shortUrl) {
        if (rateLimit.startCooldown(err)) {
          return;
        }

        setError(getCheckLinkErrorMessage(err, t));
      }
    } finally {
      if (lastRequestedShortUrlRef.current === shortUrl) {
        setIsLoading(false);
      }
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedInput = parseShortLinkInput(inputValue);
    setCopyMessage("");

    if (parsedInput.error) {
      setLink(null);
      setError(getInputErrorMessage(parsedInput.error, t));
      return;
    }

    const currentShortParam = searchParams.get("short") ?? "";
    if (currentShortParam !== parsedInput.shortUrl) {
      setSearchParams({ short: parsedInput.shortUrl });
      return;
    }

    void checkShortUrl(parsedInput.shortUrl);
  }

  async function copyShortLink() {
    if (!shortLink) {
      return;
    }

    await navigator.clipboard.writeText(shortLink);
    setCopyMessage(t("checkLink.copied"));
  }

  return (
    <div className="stack-xl">
      <section className="details-hero check-hero">
        <div>
          <p className="eyebrow">{t("checkLink.eyebrow")}</p>
          <h1>{t("checkLink.title")}</h1>
          <p>{t("checkLink.description")}</p>
        </div>
      </section>

      <section className="panel-section check-panel">
        <form className="check-form" onSubmit={handleSubmit}>
          <label>
            {t("checkLink.inputLabel")}
            <input
              onChange={(event) => {
                setInputValue(event.target.value);
                setError("");
              }}
              placeholder={t("checkLink.inputPlaceholder")}
              type="text"
              value={inputValue}
            />
          </label>
          <button disabled={isLoading} type="submit">
            {t("checkLink.submit")}
          </button>
        </form>

        {isLoading && <LoadingState label={t("checkLink.loading")} />}
        {rateLimit.hasRateLimit && (
          <RateLimitNotice />
        )}
        {error && <Message type="error">{error}</Message>}
        {copyMessage && <Message type="success">{copyMessage}</Message>}
      </section>

      {link && (
        <article className="result-card check-result-card">
          <div className="check-result-heading">
            <div>
              <p className="card-kicker">{t("checkLink.resultEyebrow")}</p>
              <h2>{link.short_url}</h2>
            </div>
            <div className="link-card-badges">
              <span className={getStatusClassName(link, isExpired)}>{getStatusText(link, isExpired, t)}</span>
              <span className="status-pill status-public">
                {link.user_id === null ? t("checkLink.publicType") : t("checkLink.personalType")}
              </span>
            </div>
          </div>

          <dl className="check-link-details">
            <div>
              <dt>{t("checkLink.shortAlias")}</dt>
              <dd>{link.short_url}</dd>
            </div>
            <div>
              <dt>{t("checkLink.fullShortLink")}</dt>
              <dd>
                <a href={shortLink} rel="noreferrer" target="_blank">
                  {shortLink}
                </a>
              </dd>
            </div>
            <div>
              <dt>{t("checkLink.originalLink")}</dt>
              <dd>
                <a href={link.url} rel="noreferrer" target="_blank">
                  {link.url}
                </a>
              </dd>
            </div>
            <div>
              <dt>{t("checkLink.clicks")}</dt>
              <dd>{link.total}</dd>
            </div>
            <div>
              <dt>{t("checkLink.expiresAt")}</dt>
              <dd>{link.expires_at ? formatDateTime(link.expires_at, language) : t("linkCard.noExpiry")}</dd>
            </div>
          </dl>

          {isUnavailable && <Message type="info">{t("checkLink.redirectWarning")}</Message>}

          <div className="actions-row">
            <button className="secondary-button" onClick={copyShortLink} type="button">
              {t("checkLink.copyShortLink")}
            </button>
            <a className="primary-link-button" href={shortLink} rel="noreferrer" target="_blank">
              {t("checkLink.openShortLink")}
            </a>
            <a className="ghost-button" href={link.url} rel="noreferrer" target="_blank">
              {t("checkLink.openOriginalLink")}
            </a>
            <Link className="ghost-button" to={`/links/${link.short_url}`}>
              {t("common.details")}
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}

function getInputErrorMessage(error: ParseResult["error"], t: (key: TranslationKey) => string) {
  if (error === "empty") {
    return t("checkLink.errorEmpty");
  }

  if (error === "spaces") {
    return t("checkLink.errorSpaces");
  }

  return t("checkLink.errorFormat");
}

function getCheckLinkErrorMessage(error: unknown, t: (key: TranslationKey) => string) {
  if (!(error instanceof ApiError)) {
    return t("checkLink.errorGeneric");
  }

  if (error.code === "rate_limit" || error.status === 429) {
    return t("errors.rateLimit");
  }

  if (error.code === "network_error" || error.status === 0) {
    return t("errors.network");
  }

  if (error.status === 404) {
    return t("checkLink.errorNotFound");
  }

  return t("checkLink.errorGeneric");
}

function getStatusClassName(link: LinkSchema, isExpired: boolean) {
  return link.is_active && !isExpired ? "status-pill status-active" : "status-pill status-inactive";
}

function getStatusText(link: LinkSchema, isExpired: boolean, t: (key: TranslationKey) => string) {
  if (isExpired) {
    return t("checkLink.statusExpired");
  }

  return link.is_active ? t("checkLink.statusActive") : t("checkLink.statusDisabled");
}
