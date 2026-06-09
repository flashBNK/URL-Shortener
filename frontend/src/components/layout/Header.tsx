import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { UserSchema } from "../../api/types";
import { clearTokens, isAuthenticated } from "../../auth/tokenStore";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const requestedRef = useRef(false);
  const [user, setUser] = useState<UserSchema | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      requestedRef.current = false;
      setUser(null);
      return;
    }

    if (requestedRef.current) {
      return;
    }
    requestedRef.current = true;

    api
      .getMe()
      .then(setUser)
      .catch(() => {
        setUser(null);
      });
  }, [location.pathname]);

  useEffect(() => {
    function handleUserUpdated(event: Event) {
      const customEvent = event as CustomEvent<UserSchema>;
      setUser(customEvent.detail);
    }

    window.addEventListener("account:user-updated", handleUserUpdated);
    return () => window.removeEventListener("account:user-updated", handleUserUpdated);
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Local logout matters even when the backend token is already invalid.
    } finally {
      clearTokens();
      requestedRef.current = false;
      setUser(null);
      navigate("/");
    }
  }

  const authenticated = isAuthenticated();

  return (
    <header className="site-header">
      <NavLink className="logo" to="/">
        <span className="logo-mark">u</span>
        <span>Shortener</span>
      </NavLink>

      <nav className="main-nav">
        <NavLink to="/">{t("header.home")}</NavLink>
        <NavLink to="/public">{t("header.publicLinks")}</NavLink>
        <NavLink to="/dashboard">{t("header.dashboard")}</NavLink>
        {authenticated && <NavLink to="/account">{t("header.account")}</NavLink>}
      </nav>

      <div className="header-actions">
        <button
          aria-label={t("header.theme")}
          className="icon-toggle"
          onClick={toggleTheme}
          title={theme === "light" ? t("header.themeDark") : t("header.themeLight")}
          type="button"
        >
          <span className="theme-toggle-orbit">{theme === "light" ? "☾" : "☀"}</span>
        </button>
        <div className="language-switch" aria-label={t("header.language")}>
          <button className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")} type="button">
            RU
          </button>
          <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} type="button">
            EN
          </button>
        </div>
        {authenticated ? (
          <>
            <NavLink className="user-chip" to="/account">
              {user?.username ?? t("header.account")}
            </NavLink>
            <button className="secondary-button compact" onClick={handleLogout} type="button">
              {t("header.logout")}
            </button>
          </>
        ) : (
          <>
            <NavLink className="ghost-button compact" to="/login">
              {t("header.login")}
            </NavLink>
            <NavLink className="primary-link-button compact" to="/register">
              {t("header.register")}
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}
