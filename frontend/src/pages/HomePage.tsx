import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import { useI18n } from "../i18n/I18nProvider";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="stack-xl">
      <HeroSection />

      <section className="feature-grid">
        <article className="feature-card">
          <span>01</span>
          <h3>{t("home.featureShortenTitle")}</h3>
          <p>{t("home.featureShortenDescription")}</p>
        </article>
        <article className="feature-card">
          <span>02</span>
          <h3>{t("home.featureCatalogTitle")}</h3>
          <p>{t("home.featureCatalogDescription")}</p>
        </article>
        <article className="feature-card">
          <span>03</span>
          <h3>{t("home.featureAnalyticsTitle")}</h3>
          <p>{t("home.featureAnalyticsDescription")}</p>
        </article>
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">{t("home.ctaEyebrow")}</p>
          <h2>{t("home.ctaTitle")}</h2>
          <p>{t("home.ctaDescription")}</p>
        </div>
        <Link className="primary-link-button" to="/public">
          {t("home.openFeed")}
        </Link>
      </section>
    </div>
  );
}
