import type { LinkSchema } from "../api/types";

type StatsCardsProps = {
  link: LinkSchema;
};

export default function StatsCards({ link }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <article className="stat-card">
        <span>Переходы</span>
        <strong>{link.total}</strong>
      </article>
      <article className="stat-card">
        <span>Статус</span>
        <strong>{link.is_active ? "Активна" : "Отключена"}</strong>
      </article>
      <article className="stat-card">
        <span>Владелец</span>
        <strong>{link.user_id ? `ID ${link.user_id}` : "Публичная"}</strong>
      </article>
      <article className="stat-card">
        <span>Срок действия</span>
        <strong>{link.expires_at ? new Date(link.expires_at).toLocaleDateString() : "Без срока"}</strong>
      </article>
    </div>
  );
}
