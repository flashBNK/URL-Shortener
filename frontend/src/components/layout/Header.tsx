import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { UserSchema } from "../../api/types";
import { clearTokens, isAuthenticated } from "../../auth/tokenStore";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
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

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Локальный logout важнее, даже если токен уже недействителен на backend.
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
        <NavLink to="/">Главная</NavLink>
        <NavLink to="/public">Публичные ссылки</NavLink>
        <NavLink to="/dashboard">Мои ссылки</NavLink>
      </nav>

      <div className="header-actions">
        {authenticated ? (
          <>
            <span className="user-chip">{user?.username ?? "Аккаунт"}</span>
            <button className="secondary-button compact" onClick={handleLogout} type="button">
              Выйти
            </button>
          </>
        ) : (
          <>
            <NavLink className="ghost-button compact" to="/login">
              Войти
            </NavLink>
            <NavLink className="primary-link-button compact" to="/register">
              Регистрация
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}
