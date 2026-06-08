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
import EmptyState from "./EmptyState";

type ChartsProps = {
  stats: GroupByCountryLinkSchema | null;
};

const colors = ["#1d5fd0", "#17a37b", "#f59e0b", "#e05252", "#7c3aed", "#0f766e"];

function mapRecord(record: Record<string, number>, emptyLabel: string) {
  return Object.entries(record).map(([name, value]) => ({
    name: name || emptyLabel,
    value,
  }));
}

export default function Charts({ stats }: ChartsProps) {
  if (!stats) {
    return (
      <EmptyState
        description="Статистика доступна только владельцу ссылки или появится после первых переходов."
        title="Нет данных для графиков"
      />
    );
  }

  const byDate = mapRecord(stats.clicks_by_date, "Дата неизвестна");
  const byCountry = mapRecord(stats.by_country, "Страна неизвестна");
  const byDevice = mapRecord(stats.clicks_by_device, "Устройство неизвестно");
  const hasAnyData = byDate.length > 0 || byCountry.length > 0 || byDevice.length > 0;

  if (!hasAnyData) {
    return <EmptyState description="После первых переходов здесь появятся графики." title="Пока нет кликов" />;
  }

  return (
    <div className="charts-grid">
      <article className="chart-card chart-card-wide">
        <div className="chart-title">
          <h3>Клики по дням</h3>
          <span>{byDate.length ? "LineChart" : "нет данных"}</span>
        </div>
        {byDate.length ? (
          <ResponsiveContainer height={260} width="100%">
            <LineChart data={byDate}>
              <CartesianGrid stroke="#e7edf5" strokeDasharray="4 4" />
              <XAxis dataKey="name" tick={{ fill: "#66758c", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#66758c", fontSize: 12 }} />
              <Tooltip />
              <Line dataKey="value" name="Клики" stroke="#1d5fd0" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState description="Данных по датам пока нет." title="Нет данных" />
        )}
      </article>

      <article className="chart-card">
        <div className="chart-title">
          <h3>Страны</h3>
          <span>PieChart</span>
        </div>
        {byCountry.length ? (
          <ResponsiveContainer height={250} width="100%">
            <PieChart>
              <Pie data={byCountry} dataKey="value" innerRadius={52} nameKey="name" outerRadius={82}>
                {byCountry.map((entry, index) => (
                  <Cell fill={colors[index % colors.length]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState description="Страны появятся после кликов." title="Нет стран" />
        )}
      </article>

      <article className="chart-card">
        <div className="chart-title">
          <h3>Устройства</h3>
          <span>BarChart</span>
        </div>
        {byDevice.length ? (
          <ResponsiveContainer height={250} width="100%">
            <BarChart data={byDevice}>
              <CartesianGrid stroke="#e7edf5" strokeDasharray="4 4" />
              <XAxis dataKey="name" tick={{ fill: "#66758c", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#66758c", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#17a37b" name="Клики" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState description="Данные по устройствам пока отсутствуют." title="Нет устройств" />
        )}
      </article>
    </div>
  );
}
