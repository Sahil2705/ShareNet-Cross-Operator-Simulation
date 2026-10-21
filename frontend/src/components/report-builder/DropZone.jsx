import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X, ChevronDown, Hash, Type, Calendar } from 'lucide-react';

const AGGREGATIONS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'DISTINCT_COUNT'];

export default function DropZone({
  id,
  title,
  subtitle,
  field,
  aggregation = 'SUM',
  onRemove,
  onAggregationChange,
  showAggregation = false,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { zoneId: id },
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">{title}</label>
        <span className="text-[10px] text-slate-400">{subtitle}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[52px] p-2 rounded-xl border-2 transition-all flex items-center justify-center ${
          isOver
            ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
            : field
            ? 'border-slate-200 bg-white shadow-soft-sm'
            : 'border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        {field ? (
          <div className="w-full flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-5 h-5 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {field.dataType === 'number' ? '#' : field.dataType === 'date' ? 'D' : 'T'}
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate">
                {field.displayName || field.columnName}
              </span>
            </div>

            {/* Aggregation Selector for numeric measures */}
            {showAggregation && (
              <div className="relative shrink-0">
                <select
                  value={aggregation}
                  onChange={(e) => onAggregationChange && onAggregationChange(e.target.value)}
                  className="text-[11px] font-bold uppercase tracking-wider bg-white border border-slate-200 rounded-md px-2 py-0.5 text-slate-700 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {AGGREGATIONS.map((agg) => (
                    <option key={agg} value={agg}>
                      {agg.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Remove Field Button */}
            <button
              onClick={onRemove}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Remove Field"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium text-center">
            {isOver ? 'Release to drop field' : 'Drag field here'}
          </p>
        )}
      </div>
    </div>
  );
}
