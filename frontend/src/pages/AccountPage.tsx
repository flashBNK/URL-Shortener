import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ApiError, type UserSchema } from "../api/types";
import { clearTokens, isAuthenticated } from "../auth/tokenStore";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";
import RateLimitNotice from "../components/RateLimitNotice";
import { usePageTitle } from "../hooks/usePageTitle";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";
import { formatDate } from "../utils/formatters";

export default function AccountPage() {
  const { language, t } = useI18n();
  usePageTitle("pageTitles.account");
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSchema | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [revokeError, setRevokeError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const profileRateLimit = useRateLimitCooldown();
  const passwordRateLimit = useRateLimitCooldown();
  const deleteRateLimit = useRateLimitCooldown();
  const revokeRateLimit = useRateLimitCooldown();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    async function loadAccount() {
      setError("");
      setIsLoading(true);

      try {
        const response = await api.getMe();
        setUser(response);
        setUsername(response.username);
        setEmail(response.email);
      } catch (err) {
        setError(getAccountErrorMessage(err, "account.errorLoad", t));
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadAccount();
  }, [navigate, t]);

  const profileChanged = Boolean(user && (username.trim() !== user.username || email.trim() !== user.email));

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !profileChanged) {
      return;
    }

    setMessage("");
    setProfileError("");
    profileRateLimit.resetCooldown();
    setIsSavingProfile(true);

    try {
      const updatedUser = await api.updateUser({
        username: username.trim(),
        email: email.trim(),
      });
      setUser(updatedUser);
      setUsername(updatedUser.username);
      setEmail(updatedUser.email);
      setMessage(t("account.changesSaved"));
      window.dispatchEvent(new CustomEvent("account:user-updated", { detail: updatedUser }));
    } catch (err) {
      if (profileRateLimit.startCooldown(err)) {
        return;
      }

      setProfileError(getAccountErrorMessage(err, "account.errorUpdate", t));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setPasswordError("");
    passwordRateLimit.resetCooldown();

    if (!currentPassword || !newPassword || !repeatPassword) {
      setPasswordError(t("account.errorPasswordFields"));
      return;
    }

    if (newPassword !== repeatPassword) {
      setPasswordError(t("account.passwordsMismatch"));
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setMessage(t("account.passwordChanged"));
    } catch (err) {
      if (passwordRateLimit.startCooldown(err)) {
        return;
      }

      setPasswordError(getAccountErrorMessage(err, "account.errorPasswordChange", t));
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    deleteRateLimit.resetCooldown();

    if (!deletePassword) {
      setDeleteError(t("account.errorCurrentPasswordRequired"));
      return;
    }

    setIsDeleting(true);

    try {
      await api.deleteAccount({ current_password: deletePassword });
      clearTokens();
      navigate("/", { state: { message: t("account.accountDeleted") } });
    } catch (err) {
      if (deleteRateLimit.startCooldown(err)) {
        setIsDeleting(false);
        return;
      }

      setDeleteError(getAccountErrorMessage(err, "account.errorDelete", t));
      setIsDeleting(false);
    }
  }

  async function handleRevokeAllTokens() {
    setRevokeError("");
    revokeRateLimit.resetCooldown();
    setIsRevoking(true);

    try {
      await api.revokeAllTokens();
      clearTokens();
      navigate("/login", { state: { message: t("account.allSessionsSignedOut") } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        navigate("/login", { state: { message: t("errors.sessionExpired") } });
        return;
      }

      if (err instanceof ApiError && err.status === 404) {
        clearTokens();
        navigate("/login", { state: { message: t("account.sessionsNotFound") } });
        return;
      }

      if (revokeRateLimit.startCooldown(err)) {
        return;
      }

      setRevokeError(getAccountErrorMessage(err, "account.errorRevokeAll", t));
    } finally {
      setIsRevoking(false);
    }
  }

  if (isLoading) {
    return <LoadingState label={t("account.loading")} />;
  }

  if (error) {
    return (
      <section className="narrow-page">
        <Message type="error">{error}</Message>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="stack-xl account-page">
      <div className="dashboard-hero account-hero">
        <div>
          <p className="eyebrow">{t("account.eyebrow")}</p>
          <h1>{t("account.title")}</h1>
          <p>{t("account.description")}</p>
        </div>
        <div className="account-avatar">{user.username.slice(0, 1).toUpperCase()}</div>
      </div>

      {message && <Message type="success">{message}</Message>}

      <section className="account-grid">
        <article className="panel-section profile-summary">
          <p className="eyebrow">{t("account.profile")}</p>
          <h2>{user.username}</h2>
          <div className="account-meta-list">
            <span>{t("account.email")}</span>
            <strong>{user.email}</strong>
            <span>{t("account.createdAt")}</span>
            <strong>{formatDate(user.created_at, language)}</strong>
          </div>
        </article>

        <form className="panel-section account-form" onSubmit={handleProfileSubmit}>
          <div>
            <p className="eyebrow">{t("account.settings")}</p>
            <h2>{t("account.profileSettings")}</h2>
          </div>
          <label>
            {t("account.username")}
            <input onChange={(event) => setUsername(event.target.value)} required value={username} />
          </label>
          <label>
            {t("account.email")}
            <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          {profileRateLimit.hasRateLimit && (
            <RateLimitNotice />
          )}
          {profileError && <Message type="error">{profileError}</Message>}
          <button disabled={!profileChanged || isSavingProfile} type="submit">
            {isSavingProfile ? t("account.saving") : t("account.saveChanges")}
          </button>
        </form>
      </section>

      <form className="panel-section account-form" onSubmit={handlePasswordSubmit}>
        <div>
          <p className="eyebrow">{t("account.security")}</p>
          <h2>{t("account.changePassword")}</h2>
        </div>
        <div className="account-form-grid">
          <label>
            {t("account.currentPassword")}
            <input
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              value={currentPassword}
            />
          </label>
          <label>
            {t("account.newPassword")}
            <span className="password-field">
              <input
                onChange={(event) => setNewPassword(event.target.value)}
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
              />
              <button
                className="password-toggle"
                onClick={() => setShowNewPassword((value) => !value)}
                type="button"
              >
                {showNewPassword ? t("account.hidePassword") : t("account.showPassword")}
              </button>
            </span>
          </label>
          <label>
            {t("account.repeatPassword")}
            <input
              onChange={(event) => setRepeatPassword(event.target.value)}
              type="password"
              value={repeatPassword}
            />
          </label>
        </div>
        {passwordRateLimit.hasRateLimit && (
          <RateLimitNotice />
        )}
        {passwordError && <Message type="error">{passwordError}</Message>}
        <div className="actions-row">
          <button disabled={isChangingPassword} type="submit">
            {isChangingPassword ? t("account.changingPassword") : t("account.changePassword")}
          </button>
        </div>
      </form>

      <section className="panel-section security-sessions">
        <div>
          <p className="eyebrow">{t("account.security")}</p>
          <h2>{t("account.signOutAllDevices")}</h2>
          <p>{t("account.signOutAllDescription")}</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => {
            setRevokeError("");
            setIsRevokeOpen(true);
          }}
          type="button"
        >
          {t("account.signOutAllDevices")}
        </button>
      </section>

      <section className="danger-zone">
        <div>
          <p className="eyebrow">{t("account.dangerZone")}</p>
          <h2>{t("account.deleteAccount")}</h2>
          <p>{t("account.deleteDescription")}</p>
        </div>
        <button className="danger-button" onClick={() => setIsDeleteOpen(true)} type="button">
          {t("account.deleteAccount")}
        </button>
      </section>

      {isDeleteOpen && (
        <div aria-labelledby="delete-account-title" aria-modal="true" className="modal-backdrop" role="dialog">
          <div className="edit-modal delete-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{t("account.dangerZone")}</p>
                <h2 id="delete-account-title">{t("account.deleteAccountQuestion")}</h2>
              </div>
              <button
                aria-label={t("account.cancel")}
                className="icon-close"
                onClick={() => setIsDeleteOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="delete-warning">{t("account.deleteModalDescription")}</p>
            <label className="account-delete-password">
              {t("account.currentPassword")}
              <input
                onChange={(event) => setDeletePassword(event.target.value)}
                type="password"
                value={deletePassword}
              />
            </label>
            {deleteRateLimit.hasRateLimit && (
              <RateLimitNotice />
            )}
            {deleteError && <Message type="error">{deleteError}</Message>}
            <div className="modal-actions">
              <button className="ghost-button" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)} type="button">
                {t("account.cancel")}
              </button>
              <button
                className="danger-button"
                disabled={isDeleting}
                onClick={() => void handleDeleteAccount()}
                type="button"
              >
                {isDeleting ? t("account.deletingAccount") : t("account.deleteAccount")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRevokeOpen && (
        <div aria-labelledby="revoke-all-title" aria-modal="true" className="modal-backdrop" role="dialog">
          <div className="edit-modal delete-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{t("account.security")}</p>
                <h2 id="revoke-all-title">{t("account.signOutAllQuestion")}</h2>
              </div>
              <button
                aria-label={t("account.cancel")}
                className="icon-close"
                disabled={isRevoking}
                onClick={() => setIsRevokeOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="delete-warning">{t("account.signOutAllModalDescription")}</p>
            {revokeRateLimit.hasRateLimit && (
              <RateLimitNotice />
            )}
            {revokeError && <Message type="error">{revokeError}</Message>}
            <div className="modal-actions">
              <button
                className="ghost-button"
                disabled={isRevoking}
                onClick={() => setIsRevokeOpen(false)}
                type="button"
              >
                {t("account.cancel")}
              </button>
              <button
                className="secondary-button"
                disabled={isRevoking}
                onClick={() => void handleRevokeAllTokens()}
                type="button"
              >
                {isRevoking ? t("account.signingOutSessions") : t("account.signOutAllDevices")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function getAccountErrorMessage(error: unknown, fallback: TranslationKey, t: (key: TranslationKey) => string) {
  if (!(error instanceof ApiError)) {
    return t(fallback);
  }

  if (error.code === "unauthorized" || error.status === 401) {
    return t("errors.sessionExpired");
  }

  if (error.code === "rate_limit" || error.status === 429) {
    return t("errors.rateLimit");
  }

  if (error.code === "network_error" || error.status === 0) {
    return t("errors.network");
  }

  if (error.status === 403) {
    return t("account.errorForbidden");
  }

  if (error.status === 409) {
    return t("account.errorConflict");
  }

  if (error.status === 400) {
    return t("account.errorBadRequest");
  }

  return t(fallback);
}
