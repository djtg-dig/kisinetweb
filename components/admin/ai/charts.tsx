// Graphiques SVG natifs pour le tableau de bord IA.
//
// Aucune dépendance externe (recharts non installé) : on dessine des barres,
// lignes et donuts en SVG responsive (viewBox). Tous les composants respectent
// le thème clair/sombre via les classes sémantiques et des couleurs fixes
// lisibles dans les deux modes.

export type ChartDatum = { label: string; value: number };
export type ChartSeries = { name: string; color: string; data: ChartDatum[] };

// Palette de couleurs utilisée pour les répartitions et séries.
export const chartPalette = [
  "#1a4b80", // primary
  "#10B981", // success
  "#F59E0B", // warning
  "#EF4444", // error
  "#06B6D4", // info
  "#E8C020", // accent
  "#8B5CF6", // violet
  "#64748B", // slate
];

const PRIMARY = "#164271";

function niceMax(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let step = 1;
  if (normalized > 5) {
    step = 10;
  } else if (normalized > 2) {
    step = 5;
  } else if (normalized > 1) {
    step = 2;
  }
  return step * magnitude;
}

// ---------------------------------------------------------------------------
// BarChart (colonnes verticales)
// ---------------------------------------------------------------------------

export function BarChart({
  data,
  height = 220,
  color = PRIMARY,
  formatValue = (value: number) => String(value),
  yMax,
}: {
  data: ChartDatum[];
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
  yMax?: number;
}) {
  const width = Math.max(data.length * 28, 240);
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = yMax ?? niceMax(Math.max(0, ...data.map((d) => d.value)));
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.min(28, slot * 0.6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Graphique en barres"
    >
      {data.map((datum, index) => {
        const h = max === 0 ? 0 : (datum.value / max) * innerH;
        const x = padding.left + index * slot + (slot - barW) / 2;
        const y = padding.top + innerH - h;
        return (
          <g key={datum.label}>
            <rect x={x} y={y} width={barW} height={Math.max(0, h)} rx={3} fill={color} />
            <text
              x={x + barW / 2}
              y={padding.top + innerH + 18}
              textAnchor="middle"
              className="fill-app-muted"
              fontSize="9"
            >
              {datum.label}
            </text>
            {datum.value > 0 ? (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-app-text"
                fontSize="9"
                fontWeight="bold"
              >
                {formatValue(datum.value)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// LineChart (une ou plusieurs séries, avec aire pour une série unique)
// ---------------------------------------------------------------------------

export function LineChart({
  series,
  height = 240,
  formatValue = (value: number) => String(value),
}: {
  series: ChartSeries[];
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const labels = series[0]?.data.map((d) => d.label) ?? [];
  const width = Math.max(labels.length * 24, 240);
  const padding = { top: 16, right: 14, bottom: 28, left: 14 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = niceMax(Math.max(0, ...allValues));
  const slot = labels.length ? innerW / Math.max(1, labels.length - 1) : innerW;

  const pointFor = (index: number, value: number) => {
    const x = padding.left + index * slot;
    const y = padding.top + innerH - (max === 0 ? 0 : (value / max) * innerH);
    return { x, y };
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Graphique en courbes"
    >
      {series.map((s) => {
        const points = s.data.map((d, i) => pointFor(i, d.value));
        const linePath = points
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
          .join(" ");
        const areaPath =
          series.length === 1 && points.length
            ? `${linePath} L${points[points.length - 1].x},${padding.top + innerH} L${points[0].x},${padding.top + innerH} Z`
            : "";
        return (
          <g key={s.name}>
            {areaPath ? (
              <path d={areaPath} fill={s.color} opacity={0.12} />
            ) : null}
            <path d={linePath} fill="none" stroke={s.color} strokeWidth={2} />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={s.color} />
            ))}
          </g>
        );
      })}
      {labels.map((label, i) => (
        <text
          key={label}
          x={padding.left + i * slot}
          y={padding.top + innerH + 18}
          textAnchor="middle"
          className="fill-app-muted"
          fontSize="9"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DonutChart (répartition en anneau + légende)
// ---------------------------------------------------------------------------

export function DonutChart({
  data,
  size = 180,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = total === 0 ? 0 : d.value / total;
    const dash = fraction * circumference;
    const segment = {
      ...d,
      dashArray: `${dash} ${circumference - dash}`,
      dashOffset: -offset,
      fraction,
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Répartition"
        className="shrink-0"
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="stroke-app-border"
            strokeWidth={18}
          />
          {segments.map((s, i) => (
            <circle
              key={s.label + i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={18}
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.dashOffset}
            />
          ))}
        </g>
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-app-text"
          fontSize="20"
          fontWeight="bold"
        >
          {total.toLocaleString("fr-FR")}
        </text>
      </svg>
      <ul className="w-full space-y-1 text-sm">
        {segments.map((s, i) => (
          <li key={s.label + i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-app-text">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              {s.label}
            </span>
            <span className="font-mono text-app-muted">
              {s.value.toLocaleString("fr-FR")} (
              {(s.fraction * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)
            </span>
          </li>
        ))}
        {!segments.length ? (
          <li className="text-app-muted">Aucune donnée.</li>
        ) : null}
      </ul>
    </div>
  );
}
