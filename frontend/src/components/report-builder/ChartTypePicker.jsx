import React from 'react';
import {
  BarChart2,
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  CircleDot,
  ScatterChart,
  Activity,
  Table,
  Sparkles,
} from 'lucide-react';

const CHART_TYPES = [
  { id: 'column', name: 'Column', icon: BarChart3, description: 'Vertical bars' },
  { id: 'bar', name: 'Bar', icon: BarChart2, description: 'Horizontal bars' },
  { id: 'line', name: 'Line', icon: LineChart, description: 'Trend lines' },
  { id: 'area', name: 'Area', icon: AreaChart, description: 'Filled volume' },
  { id: 'donut', name: 'Donut', icon: CircleDot, description: 'Ring distribution' },
  { id: 'pie', name: 'Pie', icon: PieChart, description: 'Proportion share' },
  { id: 'scatter', name: 'Scatter', icon: ScatterChart, description: 'Correlation' },
  { id: 'kpi', name: 'KPI Card', icon: Activity, description: 'Single metric' },
  { id: 'table', name: 'Table', icon: Table, description: 'Data grid' },
];

export default function ChartTypePicker({
  selectedType = 'column',
  onSelectType,
  recommendedTypes = [],
}) {
  const recommendedIds = recommendedTypes.filter((r) => r.recommended).map((r) => r.chartType);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">Visualization Type</label>
        {recommendedIds.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Recommended
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CHART_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isRecommended = recommendedIds.includes(type.id);

          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/80 text-brand-700 font-bold ring-2 ring-brand-500/20 shadow-soft-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              {isRecommended && !isSelected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
              )}
              <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight">{type.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
