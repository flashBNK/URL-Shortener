import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import type { LinkSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";
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
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authenticated = isAuthenticated();
  const showVisibilitySwitch = mode === "smart" && authenticated;
  const shouldUseAuth = mode === "private" || (showVisibilitySwitch && visibility === "private");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedUrl = url.trim();
    setError("");
    setCreatedLink(null);
    setCopyMessage("");

    if (!trimmedUrl || trimmedUrl.includes(" ")) {
      setError(t("errors.createLink"));
      return;
    }

    setIsSubmitting(true);

    try {
      const link = await api.createLink(
        {
          url: trimmedUrl,
          custom_alias: customAlias.trim() ? customAlias.trim() : null,
        },
        shouldUseAuth,
      );
      setUrl("");
      setCustomAlias("");
      setCreatedLink(link);
      onCreated?.(link);
    } catch (err) {
      setError(getApiErrorMessage(err, "errors.createLink", t));
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
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t("linkForm.urlPlaceholder")}
              required
              type="text"
              value={url}
            />
            <small>{t("linkForm.helperNoScheme")}</small>
          </label>
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? t("linkForm.shortening") : t("linkForm.shorten")}
          </button>
        </div>

        <div className="alias-row">
          <label>
            {t("linkForm.aliasLabel")}
            <input
              maxLength={12}
              minLength={4}
              onChange={(event) => setCustomAlias(event.target.value)}
              placeholder={t("linkForm.aliasPlaceholder")}
              value={customAlias}
            />
          </label>
          <span>{t("linkForm.aliasHelp")}</span>
        </div>

        {error && <Message type="error">{error}</Message>}
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
