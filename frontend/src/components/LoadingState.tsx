import { useI18n } from "../i18n/I18nProvider";

type LoadingStateProps = {
  label?: string;
};

export default function LoadingState({ label }: LoadingStateProps) {
  const { t } = useI18n();

  return (
    <div className="loading-state">
      <span className="spinner" />
      <span>{label ?? t("common.loading")}</span>
    </div>
  );
}
