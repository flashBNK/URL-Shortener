import { FormEvent, useEffect, useId, useState } from "react";
import { api } from "../api/client";
import { ApiError, type LinkSchema, type LinkShortSchema, type UpdateLinkPayload } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";
import { aliasPattern } from "../utils/linkValidation";
import Message from "./Message";

type EditableLink = Pick<LinkShortSchema, "url" | "short_url" | "is_active" | "expires_at">;

type EditLinkModalProps = {
  link: EditableLink;
  onClose: () => void;
  onSaved: (link: LinkSchema) => void;
};

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

export default function EditLinkModal({ link, onClose, onSaved }: EditLinkModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [shortUrl, setShortUrl] = useState(link.short_url);
  const [isActive, setIsActive] = useState(link.is_active);
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(link.expires_at));
  const [limitLifetime, setLimitLifetime] = useState(Boolean(link.expires_at));
  const [lifetimeTouched, setLifetimeTouched] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setShortUrl(link.short_url);
    setIsActive(link.is_active);
    setExpiresAt(toDateTimeLocal(link.expires_at));
    setLimitLifetime(Boolean(link.expires_at));
    setLifetimeTouched(false);
    setError("");
  }, [link]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedShortUrl = shortUrl.trim();

    setError("");

    if (!trimmedShortUrl) {
      setError(t("editLink.errorAliasRequired"));
      return;
    }

    if (trimmedShortUrl.length < 4 || trimmedShortUrl.length > 12) {
      setError(t("editLink.errorAliasLength"));
      return;
    }

    if (!aliasPattern.test(trimmedShortUrl)) {
      setError(t("editLink.errorAliasPattern"));
      return;
    }

    const payload: UpdateLinkPayload = {};

    if (trimmedShortUrl !== link.short_url) {
      payload.short_url = trimmedShortUrl;
    }

    if (isActive !== link.is_active) {
      payload.is_active = isActive;
    }

    if (isActive && lifetimeTouched) {
      if (limitLifetime) {
        if (!expiresAt) {
          setError(t("editLink.errorExpiresAtRequired"));
          return;
        }
        payload.expires_at = fromDateTimeLocal(expiresAt);
      } else if (link.expires_at) {
        payload.expires_at = null;
      }
    }

    if (!Object.keys(payload).length) {
      onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedLink = await api.updateLink(link.short_url, payload);
      onSaved(updatedLink);
    } catch (err) {
      setError(getEditErrorMessage(err, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="edit-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{t("editLink.eyebrow")}</p>
            <h2 id={titleId}>{t("editLink.title")}</h2>
          </div>
          <button aria-label={t("editLink.cancel")} className="icon-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="edit-link-form" onSubmit={handleSubmit}>
          <div className="readonly-url">
            <span>{t("editLink.originalUrl")}</span>
            <p>{link.url}</p>
          </div>

          <label>
            {t("editLink.aliasLabel")}
            <input
              maxLength={12}
              minLength={4}
              onChange={(event) => setShortUrl(event.target.value)}
              required
              value={shortUrl}
            />
            <small>{t("editLink.aliasHelp")}</small>
          </label>

          <section className="edit-block">
            <div className="edit-block-heading">
              <div>
                <span>{t("editLink.statusLabel")}</span>
                <strong>{isActive ? t("editLink.linkIsActive") : t("editLink.linkIsDisabled")}</strong>
              </div>
              <button
                className={isActive ? "toggle-switch active" : "toggle-switch"}
                onClick={() => setIsActive((value) => !value)}
                type="button"
              >
                <span />
              </button>
            </div>
            {!isActive && <p>{t("editLink.disabledExpiryHint")}</p>}
          </section>

          {isActive && (
            <section className="edit-block">
              <div className="edit-block-heading">
                <div>
                  <span>{t("editLink.expiresAtLabel")}</span>
                  <strong>{limitLifetime ? t("editLink.limitLifetime") : t("editLink.noExpiry")}</strong>
                </div>
                <button
                  className={limitLifetime ? "toggle-switch active" : "toggle-switch"}
                  onClick={() => {
                    setLimitLifetime((value) => !value);
                    setLifetimeTouched(true);
                    if (limitLifetime) {
                      setExpiresAt("");
                    }
                  }}
                  type="button"
                >
                  <span />
                </button>
              </div>

              {limitLifetime ? (
                <label className="nested-field">
                  {t("editLink.setExpiry")}
                  <input
                    onChange={(event) => {
                      setExpiresAt(event.target.value);
                      setLifetimeTouched(true);
                    }}
                    type="datetime-local"
                    value={expiresAt}
                  />
                  <small>{t("editLink.expiresAtHelp")}</small>
                </label>
              ) : (
                <div className="unlimited-panel active">
                  <div>
                    <strong>{t("editLink.unlimitedLifetime")}</strong>
                    <span>{t("editLink.unlimitedDescription")}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {error && <Message type="error">{error}</Message>}

          <div className="modal-actions">
            <button className="ghost-button" disabled={isSubmitting} onClick={onClose} type="button">
              {t("editLink.cancel")}
            </button>
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? t("editLink.saving") : t("editLink.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getEditErrorMessage(error: unknown, t: (key: TranslationKey) => string) {
  if (!(error instanceof ApiError)) {
    return t("editLink.errorGeneric");
  }

  if (error.code === "unauthorized" || error.status === 401) {
    return t("errors.sessionExpired");
  }

  if (error.code === "rate_limit" || error.status === 429) {
    return t("errors.rateLimit");
  }

  if (error.status === 403) {
    return t("editLink.errorForbidden");
  }

  if (error.status === 404) {
    return t("editLink.errorNotFound");
  }

  if (error.status === 409) {
    return t("editLink.errorAliasTaken");
  }

  return error.message || t("editLink.errorGeneric");
}
