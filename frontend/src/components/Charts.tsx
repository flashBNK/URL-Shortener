import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GroupByCountryLinkSchema } from "../api/types";
import { useI18n } from "../i18n/I18nProvider";
import EmptyState from "./EmptyState";

type ChartsProps = {
  stats: GroupByCountryLinkSchema | null;
};

const colors = ["#1d5fd0", "#17a37b", "#f59e0b", "#e05252", "#7c3aed", "#0f766e"];
const chartMinHeight = 220;
const lineChartMinHeight = 230;
const chartMinWidth = 240;

function mapRecord(record: Record<string, number>, emptyLabel: string) {
  return Object.entries(record).map(([name, value]) => ({
    name: name || emptyLabel,
    value,
  }));
}

export default function Charts({ stats }: ChartsProps) {
  const { t } = useI18n();

  if (!stats) {
    return (
      <EmptyState
        description={t("charts.emptyChartsDescription")}
        title={t("charts.emptyChartsTitle")}
      />
    );
  }

  const byDate = mapRecord(stats.clicks_by_date, t("charts.dateUnknown"));
  const byCountry = mapRecord(stats.by_country, t("charts.countryUnknown"));
  const byDevice = mapRecord(stats.clicks_by_device, t("charts.deviceUnknown"));
  const hasAnyData = byDate.length > 0 || byCountry.length > 0 || byDevice.length > 0;

  if (!hasAnyData) {
    return <EmptyState description={t("charts.emptyClicksDescription")} title={t("charts.emptyClicksTitle")} />;
  }

  return (
    <div className="charts-grid">
      <article className="chart-card chart-card-wide">
        <div className="chart-title">
          <h3>{t("charts.clicksByDay")}</h3>
          <span>{byDate.length ? t("common.clicks") : t("common.noData")}</span>
        </div>
        {byDate.length ? (
          <div className="chart-viewport chart-viewport-line">
            <ResponsiveContainer height="100%" minHeight={lineChartMinHeight} minWidth={chartMinWidth} width="100%">
              <LineChart data={byDate}>
                <CartesianGrid className="chart-grid-line" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip />
                <Line
                  dataKey="value"
                  name={t("common.clicks")}
                  stroke="var(--accent)"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description={t("charts.emptyDatesDescription")} title={t("common.noData")} />
        )}
      </article>

      <article className="chart-card">
        <div className="chart-title">
          <h3>{t("charts.countries")}</h3>
          <span>{byCountry.length ? t("common.total") : t("common.noData")}</span>
        </div>
        {byCountry.length ? (
          <div className="chart-viewport">
            <ResponsiveContainer height="100%" minHeight={chartMinHeight} minWidth={chartMinWidth} width="100%">
              <PieChart>
                <Pie data={byCountry} dataKey="value" innerRadius={52} nameKey="name" outerRadius={82}>
                  {byCountry.map((entry, index) => (
                    <Cell fill={colors[index % colors.length]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description={t("charts.emptyCountriesDescription")} title={t("charts.emptyCountriesTitle")} />
        )}
      </article>

      <article className="chart-card">
        <div className="chart-title">
          <h3>{t("charts.devices")}</h3>
          <span>{byDevice.length ? t("common.total") : t("common.noData")}</span>
        </div>
        {byDevice.length ? (
          <div className="chart-viewport">
            <ResponsiveContainer height="100%" minHeight={chartMinHeight} minWidth={chartMinWidth} width="100%">
              <BarChart data={byDevice}>
                <CartesianGrid className="chart-grid-line" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent-2)" name={t("common.clicks")} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description={t("charts.emptyDevicesDescription")} title={t("common.noData")} />
        )}
      </article>
    </div>
  );
}
