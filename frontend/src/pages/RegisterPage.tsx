import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Message from "../components/Message";
import RateLimitNotice from "../components/RateLimitNotice";
import { useRateLimitCooldown } from "../hooks/useRateLimitCooldown";
import { useI18n } from "../i18n/I18nProvider";
import { getApiErrorMessage } from "../utils/apiErrors";

export default function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rateLimit = useRateLimitCooldown();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitRegister();
  }

  async function submitRegister() {
    setError("");
    rateLimit.resetCooldown();
    setIsSubmitting(true);

    try {
      await api.register({ username, email, password });
      navigate("/login", { state: { message: t("auth.registerSuccess") } });
    } catch (err) {
      if (rateLimit.startCooldown(err)) {
        return;
      }

      setError(getApiErrorMessage(err, "errors.register", t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">{t("auth.registerEyebrow")}</p>
        <h1>{t("auth.registerTitle")}</h1>
        <p>{t("auth.registerDescription")}</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <label>
          {t("common.username")}
          <input onChange={(event) => setUsername(event.target.value)} required value={username} />
        </label>
        <label>
          {t("common.email")}
          <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          {t("common.password")}
          <input
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t("auth.registerSubmitting") : t("auth.registerSubmit")}
        </button>
        {rateLimit.hasRateLimit && (
          <RateLimitNotice />
        )}
        {error && <Message type="error">{error}</Message>}
        <p className="muted">
          {t("auth.withAccount")} <Link to="/login">{t("auth.signInLink")}</Link>.
        </p>
      </form>
    </section>
  );
}
