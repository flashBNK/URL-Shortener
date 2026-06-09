import { useId, useState } from "react";
import { api } from "../api/client";
import { ApiError, type LinkShortSchema } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";
import Message from "./Message";

type DeleteLinkModalProps = {
  link: Pick<LinkShortSchema, "short_url" | "url">;
  onClose: () => void;
  onDeleted: (shortUrl: string) => void;
};

export default function DeleteLinkModal({ link, onClose, onDeleted }: DeleteLinkModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      await api.deleteLink(link.short_url);
      onDeleted(link.short_url);
    } catch (err) {
      setError(getDeleteErrorMessage(err, t));
      setIsDeleting(false);
    }
  }

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="edit-modal delete-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{t("deleteLink.dangerZone")}</p>
            <h2 id={titleId}>{t("deleteLink.title")}</h2>
          </div>
          <button aria-label={t("deleteLink.cancel")} className="icon-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="delete-summary">
          <strong>/{link.short_url}</strong>
          <span>{link.url}</span>
        </div>

        <p className="delete-warning">{t("deleteLink.description")}</p>

        {error && <Message type="error">{error}</Message>}

        <div className="modal-actions">
          <button className="ghost-button" disabled={isDeleting} onClick={onClose} type="button">
            {t("deleteLink.cancel")}
          </button>
          <button className="danger-button" disabled={isDeleting} onClick={() => void handleDelete()} type="button">
            {isDeleting ? t("deleteLink.deleting") : t("deleteLink.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDeleteErrorMessage(error: unknown, t: (key: TranslationKey) => string) {
  if (!(error instanceof ApiError)) {
    return t("deleteLink.errorGeneric");
  }

  if (error.code === "unauthorized" || error.status === 401) {
    return t("errors.sessionExpired");
  }

  if (error.code === "rate_limit" || error.status === 429) {
    return t("errors.rateLimit");
  }

  if (error.status === 403) {
    return t("deleteLink.errorForbidden");
  }

  if (error.status === 404) {
    return t("deleteLink.errorNotFound");
  }

  return error.message || t("deleteLink.errorGeneric");
}
