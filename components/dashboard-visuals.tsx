import type { DashboardItem, HeatmapCell, RepositoryDetailPayload } from "@/lib/dashboard-types";

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

export function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <article className={`summary-card summary-card--${accent}`}>
      <span className="summary-card__label">{label}</span>
      <strong className="summary-card__value">{value}</strong>
    </article>
  );
}

export function LanguageDistributionChart({
  items,
  title,
  unknownLabel = "Unknown",
}: {
  items: DashboardItem[];
  title: string;
  unknownLabel?: string;
}) {
  const totals = new Map<string, number>();

  for (const item of items) {
    const key = item.language ?? unknownLabel;
    totals.set(key, (totals.get(key) ?? 0) + item.rangeStars);
  }

  const rows = Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8);
  const maxValue = rows[0]?.[1] ?? 1;

  return (
    <section className="signal-card">
      <div className="signal-card__header">
        <h3>{title}</h3>
      </div>
      <div className="bars">
        {rows.map(([language, value]) => (
          <div key={language} className="bars__row">
            <div className="bars__meta">
              <span>{language}</span>
              <strong>{formatCompactNumber(value)}</strong>
            </div>
            <div className="bars__track">
              <div className="bars__fill" style={{ width: `${(value / maxValue) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DailyHeatmap({
  cells,
  title,
}: {
  cells: HeatmapCell[];
  title: string;
}) {
  const max = Math.max(1, ...cells.map((cell) => cell.value));

  return (
    <section className="signal-card">
      <div className="signal-card__header">
        <h3>{title}</h3>
      </div>
      <div className="heatmap">
        {cells.map((cell) => (
          <div key={cell.date} className="heatmap__cell-wrap">
            <div
              className="heatmap__cell"
              title={`${cell.date}: ${cell.value}`}
              style={{
                opacity: Math.max(0.12, cell.value / max),
              }}
            />
            <span className="heatmap__label">{cell.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function TrendComparisonChart({
  details,
  title,
  emptyLabel,
}: {
  details: RepositoryDetailPayload[];
  title: string;
  emptyLabel: string;
}) {
  if (details.length < 2) {
    return (
      <section className="signal-card">
        <div className="signal-card__header">
          <h3>{title}</h3>
        </div>
        <div className="signal-card__empty">{emptyLabel}</div>
      </section>
    );
  }

  const maxPoints = Math.max(...details.map((detail) => detail.snapshots.length), 2);
  const maxStars = Math.max(...details.flatMap((detail) => detail.snapshots.map((snapshot) => snapshot.stars)), 1);
  const palette = ["#56e0ff", "#4dffd2", "#4c8cff", "#ff5fd2", "#ffbf5f"];

  return (
    <section className="signal-card">
      <div className="signal-card__header">
        <h3>{title}</h3>
      </div>
      <div className="trend-chart">
        <svg viewBox="0 0 640 280" role="img" aria-label={title}>
          <rect x="0" y="0" width="640" height="280" rx="18" className="trend-chart__bg" />
          {[0.2, 0.4, 0.6, 0.8].map((line) => (
            <line
              key={line}
              x1="24"
              y1={20 + 240 * line}
              x2="616"
              y2={20 + 240 * line}
              className="trend-chart__grid"
            />
          ))}
          {details.map((detail, index) => {
            const color = palette[index % palette.length];
            const points = detail.snapshots.map((snapshot, pointIndex) => ({
              x: 24 + (pointIndex / Math.max(1, maxPoints - 1)) * 592,
              y: 252 - (snapshot.stars / maxStars) * 220,
            }));

            return (
              <polyline
                key={detail.fullName}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={buildPolyline(points)}
              />
            );
          })}
        </svg>
        <div className="trend-chart__legend">
          {details.map((detail, index) => (
            <div key={detail.fullName} className="trend-chart__legend-item">
              <span
                className="trend-chart__legend-swatch"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              <span>{detail.fullName}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
