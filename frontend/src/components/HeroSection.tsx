import { useI18n } from "../i18n/I18nProvider";
import LinkForm from "./LinkForm";

type HeroSectionProps = {
  onCreated?: () => void;
};

export default function HeroSection({ onCreated }: HeroSectionProps) {
  const { t } = useI18n();

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <div className="hero-logo">u</div>
        <p className="eyebrow">{t("home.heroEyebrow")}</p>
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroDescription")}</p>
      </div>
      <div className="hero-panel">
        <LinkForm mode="smart" onCreated={onCreated} />
      </div>
    </section>
  );
}
