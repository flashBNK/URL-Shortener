import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";

export default function HomePage() {
  return (
    <div className="stack-xl">
      <HeroSection />

      <section className="feature-grid">
        <article className="feature-card">
          <span>01</span>
          <h3>Мгновенное сокращение</h3>
          <p>Создавайте короткие ссылки без лишних шагов и открывайте их через backend redirect.</p>
        </article>
        <article className="feature-card">
          <span>02</span>
          <h3>Личный каталог</h3>
          <p>Приватные ссылки сохраняются в аккаунте и остаются под вашим управлением.</p>
        </article>
        <article className="feature-card">
          <span>03</span>
          <h3>Базовая аналитика</h3>
          <p>Отслеживайте переходы, страны, устройства и последние клики на странице ссылки.</p>
        </article>
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">Общая лента</p>
          <h2>Посмотрите публичные ссылки</h2>
          <p>Публичные ссылки создаются без привязки к аккаунту и доступны в общей ленте.</p>
        </div>
        <Link className="primary-link-button" to="/public">
          Открыть ленту
        </Link>
      </section>
    </div>
  );
}
