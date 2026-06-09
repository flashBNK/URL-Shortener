import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import Message from "../components/Message";
import { useI18n } from "../i18n/I18nProvider";

export default function HomePage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { message?: string } | null;

  useEffect(() => {
    if (state?.message) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, navigate, state?.message]);

  return (
    <div className="stack-xl">
      {state?.message && <Message type="success">{state.message}</Message>}
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
