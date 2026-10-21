import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function KpiCard({
  title = 'Metric',
  value = 0,
  prefix = '',
  suffix = '',
  format = 'currency', // 'currency' | 'number' | 'percent'
  delta = null, // e.g. '+18.5%'
  subtitle = '',
  aggregation = '',
  measureField = '',
}) {
  const formattedValue = React.useMemo(() => {
    const num = Number(value);
    if (isNaN(num)) return value;

    if (format === 'currency') {
      return (prefix || '₹') + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }
    if (format === 'percent') {
      return num.toFixed(1) + '%';
    }
    return (prefix || '') + num.toLocaleString() + (suffix || '');
  }, [value, format, prefix, suffix]);

  const isPositive = delta ? !delta.startsWith('-') : true;

  return (
    <div className="h-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft flex flex-col justify-between hover:shadow-soft-lg transition-all duration-200 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </span>
          {aggregation && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 uppercase">
              {aggregation}
            </span>
          )}
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight my-1">
          {formattedValue}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium truncate">
          {subtitle || (measureField ? `Calculated from ${measureField}` : 'Current period')}
        </span>

        {delta && (
          <span
            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] ${
              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
