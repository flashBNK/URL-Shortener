import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ApiError } from "../api/types";
import Message from "../components/Message";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.register({ username, email, password });
      navigate("/login", { state: { message: "Аккаунт создан. Теперь войдите." } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось зарегистрироваться.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Новый аккаунт</p>
        <h1>Создайте личный каталог ссылок</h1>
        <p>Регистрация нужна для приватных ссылок, сохранения истории и доступа к аналитике владельца.</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <label>
          Username
          <input onChange={(event) => setUsername(event.target.value)} required value={username} />
        </label>
        <label>
          Email
          <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          Password
          <input
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Создаю..." : "Создать аккаунт"}
        </button>
        {error && <Message type="error">{error}</Message>}
        <p className="muted">
          Уже есть аккаунт? <Link to="/login">Войдите</Link>.
        </p>
      </form>
    </section>
  );
}
