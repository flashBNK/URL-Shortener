import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ApiError, type LinkShortSchema } from "../api/types";
import { isAuthenticated } from "../auth/tokenStore";
import EmptyState from "../components/EmptyState";
import LinkCard from "../components/LinkCard";
import LinkForm from "../components/LinkForm";
import LoadingState from "../components/LoadingState";
import Message from "../components/Message";

export default function DashboardPage() {
  const navigate = useNavigate();
  const loadedRef = useRef(false);
  const [links, setLinks] = useState<LinkShortSchema[]>([]);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  async function loadLinks() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.getMyLinks(30, 0);
      setLinks(response.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить ссылки.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (loadedRef.current) {
      return;
    }
    loadedRef.current = true;
    void loadLinks();
  }, [navigate]);

  async function copyLink(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMessage("Ссылка скопирована.");
  }

  return (
    <section className="stack-xl">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Личный кабинет</p>
          <h1>Каталог моих ссылок</h1>
          <p>Управляйте приватными ссылками, открывайте аналитику и быстро создавайте новые short URL.</p>
        </div>
        <button onClick={() => setShowQuickCreate((value) => !value)} type="button">
          {showQuickCreate ? "Скрыть форму" : "Новая ссылка"}
        </button>
      </div>

      {showQuickCreate && (
        <section className="panel-section">
          <h2>Быстрое создание приватной ссылки</h2>
          <LinkForm mode="private" onCreated={() => void loadLinks()} />
        </section>
      )}

      {copyMessage && <Message type="success">{copyMessage}</Message>}
      {error && <Message type="error">{error}</Message>}

      {isLoading ? (
        <LoadingState label="Загружаю каталог..." />
      ) : links.length ? (
        <div className="cards-grid">
          {links.map((link) => (
            <LinkCard key={link.short_url} link={link} onCopy={copyLink} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <button onClick={() => setShowQuickCreate(true)} type="button">
              Создать первую ссылку
            </button>
          }
          description="Создайте приватную ссылку, и она появится в этом каталоге."
          title="В каталоге пока пусто"
        />
      )}

      <div className="helper-panel">
        <strong>Нужна публичная ссылка?</strong>
        <span>Создайте ее на главной без привязки к аккаунту или откройте общую ленту.</span>
        <Link to="/public">Публичные ссылки</Link>
      </div>
    </section>
  );
}
