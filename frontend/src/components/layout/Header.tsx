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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

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

  async function handleDrawerLogout() {
    setIsDrawerOpen(false);
    await handleLogout();
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  const authenticated = isAuthenticated();
  const drawerId = "mobile-navigation-drawer";

  return (
    <>
      <header className="site-header">
        <NavLink className="logo" to="/">
          <span className="logo-mark">u</span>
          <span>{t("header.brand")}</span>
        </NavLink>

        <nav className="main-nav">
          <NavLink to="/">{t("header.home")}</NavLink>
          <NavLink to="/check">{t("header.checkLink")}</NavLink>
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
              <NavLink aria-label={t("header.account")} className="user-chip mobile-user-button" to="/account">
                <span aria-hidden="true" className="user-icon-glyph" />
              </NavLink>
              <NavLink className="user-chip desktop-user-chip" to="/account">
                {user?.username ?? t("header.account")}
              </NavLink>
              <button className="secondary-button compact desktop-logout-button" onClick={handleLogout} type="button">
                {t("header.logout")}
              </button>
            </>
          ) : (
            <>
              <NavLink className="ghost-button compact header-login-link" to="/login">
                {t("header.login")}
              </NavLink>
              <NavLink className="primary-link-button compact desktop-register-link" to="/register">
                {t("header.register")}
              </NavLink>
            </>
          )}
          <button
            aria-controls={drawerId}
            aria-expanded={isDrawerOpen}
            aria-label={isDrawerOpen ? t("header.closeMenu") : t("header.openMenu")}
            className="menu-toggle"
            onClick={() => setIsDrawerOpen((value) => !value)}
            type="button"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <>
          <button
            aria-label={t("header.closeMenu")}
            className="mobile-drawer-overlay open"
            onClick={closeDrawer}
            type="button"
          />
          <aside
            aria-label={t("header.navigation")}
            aria-modal="true"
            className="mobile-drawer open"
            id={drawerId}
            role="dialog"
          >
            <div className="mobile-drawer-brand">
              <span className="logo-mark">u</span>
              <strong>{t("header.brand")}</strong>
            </div>
            <nav className="mobile-drawer-nav">
              <NavLink onClick={closeDrawer} to="/">
                {t("header.home")}
              </NavLink>
              <NavLink onClick={closeDrawer} to="/check">
                {t("header.checkLink")}
              </NavLink>
              <NavLink onClick={closeDrawer} to="/public">
                {t("header.publicLinks")}
              </NavLink>
              {authenticated ? (
                <>
                  <NavLink onClick={closeDrawer} to="/dashboard">
                    {t("header.dashboard")}
                  </NavLink>
                  <NavLink onClick={closeDrawer} to="/account">
                    {t("header.account")}
                  </NavLink>
                  <button className="mobile-drawer-logout" onClick={() => void handleDrawerLogout()} type="button">
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <>
                  <NavLink onClick={closeDrawer} to="/login">
                    {t("header.login")}
                  </NavLink>
                  <NavLink onClick={closeDrawer} to="/register">
                    {t("header.register")}
                  </NavLink>
                </>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
