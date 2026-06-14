import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useI18n } from "../i18n/I18nProvider";

export default function NotFoundPage() {
  const { t } = useI18n();
  usePageTitle("pageTitles.notFound");

  return (
    <section className="not-found-page">
      <div className="not-found-card">
        <div className="thoughtful-cat" aria-hidden="true">
          <div className="cat-ear cat-ear-left" />
          <div className="cat-ear cat-ear-right" />
          <div className="cat-face">
            <span className="cat-eye cat-eye-left" />
            <span className="cat-eye cat-eye-right" />
            <span className="cat-nose" />
            <span className="cat-mouth" />
            <span className="cat-whisker cat-whisker-left-one" />
            <span className="cat-whisker cat-whisker-left-two" />
            <span className="cat-whisker cat-whisker-right-one" />
            <span className="cat-whisker cat-whisker-right-two" />
          </div>
          <div className="cat-thought">?</div>
        </div>
        <div>
          <p className="eyebrow">{t("notFound.title")}</p>
          <h1>{t("notFound.contentTitle")}</h1>
          <p>{t("notFound.description")}</p>
        </div>
        <div className="actions-row">
          <Link className="primary-link-button" to="/">
            {t("notFound.home")}
          </Link>
          <Link className="ghost-button" to="/check">
            {t("notFound.checkLink")}
          </Link>
        </div>
      </div>
    </section>
  );
}
