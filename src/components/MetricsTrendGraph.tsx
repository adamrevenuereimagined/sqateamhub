import { useMemo } from 'react';
import { formatCurrencyCompact } from '../lib/formatters';

type TrendDataPoint = {
  weekLabel: string;
  qtdRevenue: number;
  mtdRevenue: number;
  pipeline: number;
  dealsWon: number;
  dealsAdvancing: number;
};

type MetricKey = 'qtd' | 'mtd' | 'pipeline' | 'dealsWon' | 'dealsAdvancing';

type MetricsTrendGraphProps = {
  trendData: TrendDataPoint[];
  selectedMetric: MetricKey;
};

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; color: string; formatter: (val: number) => string; getValue: (d: TrendDataPoint) => number }
> = {
  qtd: { label: 'QTD Revenue', color: '#244167', formatter: formatCurrencyCompact, getValue: (d) => d.qtdRevenue },
  mtd: { label: 'MTD Revenue', color: '#345580', formatter: formatCurrencyCompact, getValue: (d) => d.mtdRevenue },
  pipeline: { label: 'Pipeline', color: '#3A7556', formatter: formatCurrencyCompact, getValue: (d) => d.pipeline },
  dealsWon: { label: 'Deals Won', color: '#2F6B4F', formatter: (v) => v.toString(), getValue: (d) => d.dealsWon },
  dealsAdvancing: { label: 'Deals Advancing', color: '#244167', formatter: (v) => v.toString(), getValue: (d) => d.dealsAdvancing },
};

export function MetricsTrendGraph({ trendData, selectedMetric }: MetricsTrendGraphProps) {
  const config = METRIC_CONFIG[selectedMetric];

  const { points, gridLines, maxValue } = useMemo(() => {
    const values = trendData.map(config.getValue);
    const maxValue = Math.max(...values, 1);

    const points = values.map((value, index) => ({
      x: (index / (trendData.length - 1 || 1)) * 100,
      y: 100 - (value / maxValue) * 85,
      value,
      label: trendData[index].weekLabel,
    }));

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
      y: 100 - p * 85,
      value: maxValue * p,
    }));

    return { points, gridLines, maxValue };
  }, [trendData, config]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    const firstPoint = points[0];
    let path = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      const controlX1 = previous.x + (current.x - previous.x) / 3;
      const controlY1 = previous.y;
      const controlX2 = previous.x + (2 * (current.x - previous.x)) / 3;
      const controlY2 = current.y;
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${current.x} ${current.y}`;
    }
    return path;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    return `${pathData} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;
  }, [pathData, points]);

  if (trendData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
        <p className="text-sm font-medium">No data available</p>
        <p className="text-xs mt-0.5">Submit reports to see your trend</p>
      </div>
    );
  }

  const gradientId = `trendGradient-${selectedMetric}`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{config.label}</h4>
          <p className="text-xs text-slate-500">Weekly progression</p>
        </div>
        <p className="text-xs text-slate-400">
          Peak: <span className="font-medium text-slate-600">{config.formatter(maxValue)}</span>
        </p>
      </div>

      <div className="relative h-64 bg-gradient-to-b from-slate-50/60 to-white rounded-lg border border-slate-200 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((g, i) => (
            <line
              key={i}
              x1="0"
              x2="100"
              y1={g.y}
              y2={g.y}
              stroke="#E2E8F0"
              strokeWidth="0.2"
              strokeDasharray="0.6 0.6"
            />
          ))}

          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={pathData}
            fill="none"
            stroke={config.color}
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 2.5 }}
          />

          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="1"
              fill="white"
              stroke={config.color}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 2 }}
            />
          ))}
        </svg>

        <div className="absolute inset-y-0 left-0 w-px" />
        <div className="absolute bottom-2 left-0 right-0 px-2 flex justify-between text-[10px] text-slate-500">
          {points.map((point, i) => (
            <div key={i} className="text-center" style={{ width: `${100 / Math.max(points.length, 1)}%` }}>
              <div className="font-medium text-slate-600">{point.label}</div>
              <div className="text-slate-400">{config.formatter(point.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
