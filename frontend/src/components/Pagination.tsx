import { useI18n } from "../i18n/I18nProvider";

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, limit, total, isLoading, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  const start = total === 0 ? 0 : Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);
  const canGoPrevious = page > 1;
  const canGoNext = page * limit < total;

  return (
    <nav className="pagination" aria-label={t("common.page")}>
      <div>
        <strong>{t("common.page")} {page}</strong>
        <span>{t("common.showingItems", { start, end, total })}</span>
      </div>
      <div className="pagination-actions">
        <button
          className="secondary-button"
          disabled={!canGoPrevious || isLoading}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          {t("common.previous")}
        </button>
        <button
          className="secondary-button"
          disabled={!canGoNext || isLoading}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          {t("common.next")}
        </button>
      </div>
    </nav>
  );
}
