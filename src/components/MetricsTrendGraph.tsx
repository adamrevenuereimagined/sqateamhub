import { useMemo } from 'react';

type TrendDataPoint = {
  weekLabel: string;
  qtdRevenue: number;
  mtdRevenue: number;
  pipeline: number;
  dealsWon: number;
  dealsAdvancing: number;
};

type MetricsTrendGraphProps = {
  trendData: TrendDataPoint[];
  selectedMetric: 'qtd' | 'mtd' | 'pipeline' | 'dealsWon' | 'dealsAdvancing';
};

const formatCurrency = (val: number): string => {
  if (val >= 1000000) {
    return `$${(val / 1000000).toFixed(1)}M`;
  } else if (val >= 1000) {
    return `$${(val / 1000).toFixed(0)}K`;
  } else {
    return `$${val.toFixed(0)}`;
  }
};

export function MetricsTrendGraph({ trendData, selectedMetric }: MetricsTrendGraphProps) {
  const { maxValue, points, color, label, formatter } = useMemo(() => {
    let values: number[] = [];
    let label = '';
    let color = '';
    let formatter = (val: number) => val.toString();

    switch (selectedMetric) {
      case 'qtd':
        values = trendData.map(d => d.qtdRevenue);
        label = 'QTD Revenue';
        color = '#3b82f6';
        formatter = formatCurrency;
        break;
      case 'mtd':
        values = trendData.map(d => d.mtdRevenue);
        label = 'MTD Revenue';
        color = '#3b82f6';
        formatter = formatCurrency;
        break;
      case 'pipeline':
        values = trendData.map(d => d.pipeline);
        label = 'Pipeline';
        color = '#f97316';
        formatter = formatCurrency;
        break;
      case 'dealsWon':
        values = trendData.map(d => d.dealsWon);
        label = 'Deals Won';
        color = '#10b981';
        formatter = (val: number) => val.toString();
        break;
      case 'dealsAdvancing':
        values = trendData.map(d => d.dealsAdvancing);
        label = 'Deals Advancing';
        color = '#3b82f6';
        formatter = (val: number) => val.toString();
        break;
    }

    const maxValue = Math.max(...values, 1);
    const points = values.map((value, index) => ({
      x: (index / (trendData.length - 1 || 1)) * 100,
      y: 100 - (value / maxValue) * 80,
      value,
      label: trendData[index].weekLabel,
    }));

    return { maxValue, points, color, label, formatter };
  }, [trendData, selectedMetric]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';

    const firstPoint = points[0];
    let path = `M ${firstPoint.x} ${firstPoint.y}`;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];

      const controlX1 = previous.x + (current.x - previous.x) / 3;
      const controlY1 = previous.y;
      const controlX2 = previous.x + 2 * (current.x - previous.x) / 3;
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
      <div className="flex items-center justify-center h-64 text-slate-500">
        No data available for the selected quarter
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-slate-900">{label} Trend</h4>
        <p className="text-sm text-slate-600">Weekly progression throughout the quarter</p>
      </div>

      <div className="relative h-64 bg-slate-50 rounded-lg p-4">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={areaPath}
            fill={`url(#gradient-${selectedMetric})`}
          />

          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="1"
                fill={color}
                className="transition-all hover:r-2"
              />
            </g>
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2 text-xs text-slate-600">
          {points.map((point, index) => (
            <div key={index} className="text-center" style={{ width: `${100 / points.length}%` }}>
              <div className="font-medium">{point.label}</div>
              <div className="text-slate-500">{formatter(point.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
