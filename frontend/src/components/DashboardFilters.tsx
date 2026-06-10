import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";
import {
  type DashboardExpiryFilter,
  type DashboardFiltersState,
  type DashboardSort,
  type DashboardStatusFilter,
  isDashboardFiltersDefault,
} from "../utils/linkFilters";

type DashboardFiltersProps = {
  filters: DashboardFiltersState;
  foundCount: number;
  isGlobal: boolean;
  labels?: "dashboardFilters" | "publicFilters";
  pageCount: number;
  onChange: (filters: DashboardFiltersState) => void;
  onReset: () => void;
};

export default function DashboardFilters({
  filters,
  foundCount,
  isGlobal,
  labels = "dashboardFilters",
  pageCount,
  onChange,
  onReset,
}: DashboardFiltersProps) {
  const { t } = useI18n();
  const isDefault = isDashboardFiltersDefault(filters);
  const tk = (key: string) => `${labels}.${key}` as TranslationKey;

  return (
    <section className="dashboard-filter-panel">
      <div className="dashboard-filter-grid">
        <label className="dashboard-filter-search">
          <span>{t(tk("searchLabel"))}</span>
          <input
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder={t(tk("searchPlaceholder"))}
            type="search"
            value={filters.search}
          />
        </label>

        <label>
          <span>{t(tk("statusLabel"))}</span>
          <select
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as DashboardStatusFilter })
            }
            value={filters.status}
          >
            <option value="all">{t(tk("statusAll"))}</option>
            <option value="active">{t(tk("statusActive"))}</option>
            <option value="disabled">{t(tk("statusDisabled"))}</option>
            <option value="expired">{t(tk("statusExpired"))}</option>
          </select>
        </label>

        <label>
          <span>{t(tk("expiryLabel"))}</span>
          <select
            onChange={(event) =>
              onChange({ ...filters, expiry: event.target.value as DashboardExpiryFilter })
            }
            value={filters.expiry}
          >
            <option value="any">{t(tk("expiryAny"))}</option>
            <option value="none">{t(tk("expiryNone"))}</option>
            <option value="has">{t(tk("expiryHas"))}</option>
            <option value="soon">{t(tk("expirySoon"))}</option>
          </select>
        </label>

        <label>
          <span>{t(tk("sortLabel"))}</span>
          <select
            onChange={(event) => onChange({ ...filters, sort: event.target.value as DashboardSort })}
            value={filters.sort}
          >
            <option value="default">{t(tk("sortNewest"))}</option>
            <option value="oldest">{t(tk("sortOldest"))}</option>
            <option value="clicksDesc">{t(tk("sortClicksDesc"))}</option>
            <option value="clicksAsc">{t(tk("sortClicksAsc"))}</option>
            <option value="aliasAsc">{t(tk("sortAliasAsc"))}</option>
            <option value="aliasDesc">{t(tk("sortAliasDesc"))}</option>
            <option value="expiring">{t(tk("sortExpiring"))}</option>
          </select>
        </label>
      </div>

      <div className="dashboard-filter-footer">
        <span>
          {t(tk(isGlobal ? "foundAll" : "found"), {
            found: foundCount,
            total: pageCount,
          })}
        </span>
        <button className="secondary-button compact" disabled={isDefault} onClick={onReset} type="button">
          {t(tk("reset"))}
        </button>
      </div>
    </section>
  );
}
