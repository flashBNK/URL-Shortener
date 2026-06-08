import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ApiError } from "../api/types";
import { saveTokens } from "../auth/tokenStore";
import Message from "../components/Message";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { message?: string } | null;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const tokens = await api.login({ username, password });
      saveTokens(tokens);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось войти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">С возвращением</p>
        <h1>Войдите в аккаунт</h1>
        <p>После входа вы сможете создавать приватные ссылки, хранить каталог и смотреть аналитику.</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        {state?.message && <Message type="success">{state.message}</Message>}
        <label>
          Username
          <input onChange={(event) => setUsername(event.target.value)} required value={username} />
        </label>
        <label>
          Password
          <input onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Вхожу..." : "Войти"}
        </button>
        {error && <Message type="error">{error}</Message>}
        <p className="muted">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>.
        </p>
      </form>
    </section>
  );
}
