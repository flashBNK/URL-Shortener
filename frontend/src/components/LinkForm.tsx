import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, publicBaseUrl } from "../api/client";
import { ApiError, type LinkSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import LinkResultCard from "./LinkResultCard";
import Message from "./Message";

type LinkFormProps = {
  mode?: "anonymous" | "smart" | "private";
  onCreated?: (link: LinkSchema) => void;
};

export default function LinkForm({ mode = "anonymous", onCreated }: LinkFormProps) {
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
    setError("");
    setCreatedLink(null);
    setCopyMessage("");
    setIsSubmitting(true);

    try {
      const link = await api.createLink(
        {
          url,
          custom_alias: customAlias.trim() ? customAlias.trim() : null,
        },
        shouldUseAuth,
      );
      setUrl("");
      setCustomAlias("");
      setCreatedLink(link);
      onCreated?.(link);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось создать ссылку.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage("Ссылка скопирована.");
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
              Публичная ссылка
            </button>
            <button
              className={visibility === "private" ? "active" : ""}
              onClick={() => setVisibility("private")}
              type="button"
            >
              Приватная ссылка
            </button>
          </div>
        )}

        {showVisibilitySwitch && (
          <p className="helper-text">
            {visibility === "public"
              ? "Публичная ссылка создаётся без привязки к аккаунту и отображается в общей ленте."
              : "Приватная ссылка хранится в вашем каталоге и открывает аналитику владельцу."}
          </p>
        )}

        <div className="url-input-row">
          <input
            aria-label="Длинная ссылка"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/very/long/link"
            required
            type="url"
            value={url}
          />
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Сокращаю..." : "Сократить"}
          </button>
        </div>

        <div className="alias-row">
          <label>
            Короткий alias
            <input
              maxLength={12}
              minLength={4}
              onChange={(event) => setCustomAlias(event.target.value)}
              placeholder="например sale2026"
              value={customAlias}
            />
          </label>
          <span>4-12 символов, необязательно</span>
        </div>

        {error && <Message type="error">{error}</Message>}
      </form>

      {createdLink && (
        <>
          <LinkResultCard link={createdLink} onCopy={copyLink} showDetails={Boolean(createdLink.user_id)} />
          {!createdLink.user_id && (
            <div className="soft-cta">
              <strong>Хотите хранить ссылки и смотреть аналитику?</strong>
              <span>Зарегистрируйтесь, чтобы сохранять приватные ссылки в личном каталоге.</span>
              <Link to="/register">Создать аккаунт</Link>
            </div>
          )}
        </>
      )}

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {createdLink && !createdLink.user_id && (
        <p className="public-note">
          Редирект идет через backend:{" "}
          <a href={`${publicBaseUrl}/${createdLink.short_url}`} rel="noreferrer" target="_blank">
            {publicBaseUrl}/{createdLink.short_url}
          </a>
        </p>
      )}
    </div>
  );
}
