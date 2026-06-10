import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { saveTokens } from "../auth/tokenStore";
import Message from "../components/Message";
import RateLimitNotice from "../components/RateLimitNotice";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";

export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { message?: string } | null;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rateLimit = useRateLimitCooldown();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitLogin();
  }

  async function submitLogin() {
    setError("");
    rateLimit.resetCooldown();
    setIsSubmitting(true);

    try {
      const tokens = await api.login({ username, password });
      saveTokens(tokens);
      navigate("/dashboard");
    } catch (err) {
      if (rateLimit.startCooldown(err)) {
        return;
      }

      setError(getApiErrorMessage(err, "errors.login", t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">{t("auth.loginEyebrow")}</p>
        <h1>{t("auth.loginTitle")}</h1>
        <p>{t("auth.loginDescription")}</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        {state?.message && <Message type="success">{state.message}</Message>}
        <label>
          {t("common.username")}
          <input onChange={(event) => setUsername(event.target.value)} required value={username} />
        </label>
        <label>
          {t("common.password")}
          <input onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t("auth.loginSubmitting") : t("auth.loginSubmit")}
        </button>
        {rateLimit.hasRateLimit && (
          <RateLimitNotice />
        )}
        {error && <Message type="error">{error}</Message>}
        <p className="muted">
          {t("auth.noAccount")} <Link to="/register">{t("auth.signUpLink")}</Link>.
        </p>
      </form>
    </section>
  );
}
