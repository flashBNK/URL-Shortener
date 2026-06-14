import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import type { LinkSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import RateLimitNotice from "../components/RateLimitNotice";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import { getCreateLinkError } from "../utils/apiErrors";
import { validateCreateLinkUrl, validateOptionalAlias } from "../utils/linkValidation";
import LinkResultCard from "./LinkResultCard";
import Message from "./Message";

type LinkFormProps = {
  mode?: "anonymous" | "smart" | "private";
  onCreated?: (link: LinkSchema) => void;
};

export default function LinkForm({ mode = "anonymous", onCreated }: LinkFormProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [createdLink, setCreatedLink] = useState<LinkSchema | null>(null);
  const [fieldErrors, setFieldErrors] = useState({ url: "", customAlias: "", form: "" });
  const [touchedFields, setTouchedFields] = useState({ url: false, customAlias: false });
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rateLimit = useRateLimitCooldown();

  const authenticated = isAuthenticated();
  const showVisibilitySwitch = mode === "smart" && authenticated;
  const shouldUseAuth = mode === "private" || (showVisibilitySwitch && visibility === "private");
  const urlClientErrorKey = validateCreateLinkUrl(url);
  const aliasClientErrorKey = validateOptionalAlias(customAlias);
  const urlError =
    fieldErrors.url || (urlClientErrorKey && (touchedFields.url || url) ? t(urlClientErrorKey) : "");
  const aliasError =
    fieldErrors.customAlias ||
    (aliasClientErrorKey && (touchedFields.customAlias || customAlias) ? t(aliasClientErrorKey) : "");
  const hasClientErrors = Boolean(urlClientErrorKey || aliasClientErrorKey);
  const isSubmitDisabled = isSubmitting || hasClientErrors;

  function clearFieldError(field: "url" | "customAlias") {
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: "", form: "" }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmedUrl = url.trim();
    const trimmedAlias = customAlias.trim();
    const currentUrlErrorKey = validateCreateLinkUrl(trimmedUrl);
    const currentAliasErrorKey = validateOptionalAlias(trimmedAlias);

    setTouchedFields({ url: true, customAlias: true });
    setFieldErrors({ url: "", customAlias: "", form: "" });
    rateLimit.resetCooldown();
    setCreatedLink(null);
    setCopyMessage("");

    if (currentUrlErrorKey || currentAliasErrorKey) {
      return;
    }

    setIsSubmitting(true);

    try {
      const link = await api.createLink(
        {
          url: trimmedUrl,
          custom_alias: trimmedAlias || null,
        },
        shouldUseAuth,
      );
      setUrl("");
      setCustomAlias("");
      setCreatedLink(link);
      onCreated?.(link);
    } catch (err) {
      if (rateLimit.startCooldown(err)) {
        return;
      }

      const createError = getCreateLinkError(err, t);
      setFieldErrors((currentErrors) => ({ ...currentErrors, [createError.field]: createError.message }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage(t("common.copied"));
  }

  return (
    <div className="link-form-stack">
      <form className="link-form" onSubmit={handleSubmit}>
        {showVisibilitySwitch && (
          <div className="visibility-switch" role="group">
            <button
              className={visibility === "public" ? "active" : ""}
              onClick={() => setVisibility("public")}
              type="button"
            >
              {t("linkForm.publicLink")}
            </button>
            <button
              className={visibility === "private" ? "active" : ""}
              onClick={() => setVisibility("private")}
              type="button"
            >
              {t("linkForm.privateLink")}
            </button>
          </div>
        )}

        {showVisibilitySwitch && (
          <p className="helper-text">
            {visibility === "public" ? t("linkForm.publicDescription") : t("linkForm.privateDescription")}
          </p>
        )}

        <div className="url-input-row">
          <label className="url-field">
            <span>{t("linkForm.longUrlLabel")}</span>
            <input
              aria-label={t("linkForm.longUrlLabel")}
              aria-invalid={Boolean(urlError)}
              className={urlError ? "field-error" : undefined}
              onBlur={() => setTouchedFields((currentFields) => ({ ...currentFields, url: true }))}
              onChange={(event) => {
                setUrl(event.target.value);
                clearFieldError("url");
                setTouchedFields((currentFields) => ({ ...currentFields, url: true }));
              }}
              placeholder={t("linkForm.urlPlaceholder")}
              required
              type="text"
              value={url}
            />
            <small className={urlError ? "field-message field-message-error" : "field-message"}>
              {urlError || t("linkForm.helperNoScheme")}
            </small>
          </label>
          <button disabled={isSubmitDisabled} type="submit">
            {isSubmitting ? t("linkForm.shorteningButton") : t("linkForm.shorten")}
          </button>
        </div>

        <div className="alias-row">
          <label>
            {t("linkForm.aliasLabel")}
            <input
              aria-invalid={Boolean(aliasError)}
              className={aliasError ? "field-error" : undefined}
              onBlur={() => setTouchedFields((currentFields) => ({ ...currentFields, customAlias: true }))}
              onChange={(event) => {
                setCustomAlias(event.target.value);
                clearFieldError("customAlias");
                setTouchedFields((currentFields) => ({ ...currentFields, customAlias: true }));
              }}
              placeholder={t("linkForm.aliasPlaceholder")}
              value={customAlias}
            />
          </label>
          <span className={aliasError ? "field-message field-message-error" : "field-message"}>
            {aliasError || t("linkForm.aliasHelp")}
          </span>
        </div>

        {isSubmitting && <Message type="info">{t("linkForm.shortening")}</Message>}
        {rateLimit.hasRateLimit && (
          <RateLimitNotice />
        )}
        {fieldErrors.form && <Message type="error">{fieldErrors.form}</Message>}
      </form>

      {createdLink && (
        <>
          <LinkResultCard link={createdLink} onCopy={copyLink} showDetails={Boolean(createdLink.user_id)} />
          {!createdLink.user_id && (
            <div className="soft-cta">
              <strong>{t("linkForm.anonymousCtaTitle")}</strong>
              <span>{t("linkForm.anonymousCtaDescription")}</span>
              <Link to="/register">{t("linkForm.createAccount")}</Link>
            </div>
          )}
        </>
      )}

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {createdLink && !createdLink.user_id && (
        <p className="public-note">
          {t("linkForm.redirectNote")}{" "}
          <a href={`${publicBaseUrl}/${createdLink.short_url}`} rel="noreferrer" target="_blank">
            {publicBaseUrl}/{createdLink.short_url}
          </a>
        </p>
      )}
    </div>
  );
}
