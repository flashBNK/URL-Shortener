import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, errorInfo);
    }
  }

  render() {
    if (this.state.error) {
      return <ErrorBoundaryFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorBoundaryFallback({ error }: { error: Error }) {
  const { t } = useI18n();

  return (
    <section className="narrow-page error-boundary-fallback">
      <div className="empty-state">
        <div className="empty-state-icon">!</div>
        <h1>{t("errorBoundary.title")}</h1>
        <p>{t("errorBoundary.description")}</p>
        {import.meta.env.DEV && <pre>{error.message}</pre>}
        <div className="actions-row">
          <button onClick={() => window.location.reload()} type="button">
            {t("errorBoundary.reload")}
          </button>
          <Link className="ghost-button" to="/">
            {t("errorBoundary.home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
