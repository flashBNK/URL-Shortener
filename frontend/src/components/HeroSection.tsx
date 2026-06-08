import LinkForm from "./LinkForm";

type HeroSectionProps = {
  onCreated?: () => void;
};

export default function HeroSection({ onCreated }: HeroSectionProps) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <div className="hero-logo">u</div>
        <p className="eyebrow">URL Shortener SaaS</p>
        <h1>Сокращай ссылки и отслеживай переходы</h1>
        <p>
          Создавайте аккуратные короткие ссылки, делитесь ими и смотрите базовую аналитику переходов в личном кабинете.
        </p>
      </div>
      <div className="hero-panel">
        <LinkForm mode="smart" onCreated={onCreated} />
      </div>
    </section>
  );
}
