import React, { useState, useEffect, useCallback } from 'react';
import { queryService } from '../../services/queryService';
import ChartRenderer from '../charts/ChartRenderer';
import KpiCard from '../charts/KpiCard';
import DataTableWidget from '../charts/DataTableWidget';
import { RefreshCw, Trash2, MoreVertical, Edit2, Maximize2 } from 'lucide-react';

export default function DashboardWidget({
  widget,
  globalFilters = [],
  onDelete,
  onUpdateTitle,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(widget.title || 'Widget');

  const config = widget.configuration || {};
  const datasetId = widget.dataset_id || widget.datasetId;

  const loadData = useCallback(async () => {
    if (!datasetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Combine widget filters with global dashboard filters
      const combinedFilters = [...(config.filters || []), ...(globalFilters || [])];

      const res = await queryService.executeAggregation(datasetId, {
        dimensionField: config.dimensionField,
        measureField: config.measureField,
        aggregation: config.aggregation || 'SUM',
        secondaryDimension: config.secondaryDimension,
        secondaryMeasure: config.secondaryMeasure,
        filters: combinedFilters,
        sortBy: config.sortBy,
        sortOrder: config.sortOrder || 'DESC',
      });

      setData(res);
    } catch (err) {
      console.error('Widget Data Load Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to query widget data');
    } finally {
      setLoading(false);
    }
  }, [datasetId, config, globalFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    setIsEditingTitle(false);
    if (onUpdateTitle) onUpdateTitle(widget.id, title);
  };

  const widgetType = widget.widget_type || widget.widgetType || config.chartType || 'column';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-4 flex flex-col justify-between hover:shadow-soft-lg transition-all duration-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                autoFocus
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-brand-500 rounded px-1.5 py-0.5 w-full focus:outline-none"
              />
            </form>
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-bold text-slate-800 hover:text-brand-600 truncate cursor-pointer flex items-center gap-1.5"
              title="Click to rename"
            >
              {title}
              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-slate-400" />
            </h3>
          )}
          {config.measureField && (
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {config.aggregation || 'SUM'}({config.measureField})
              {config.dimensionField ? ` by ${config.dimensionField}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(widget.id)}
              title="Remove Widget"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content Body */}
      <div className="flex-1 flex flex-col justify-center min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading metrics...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <p className="text-xs font-semibold text-rose-700">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-[11px] font-bold text-rose-600 underline"
            >
              Retry Query
            </button>
          </div>
        ) : widgetType === 'kpi' ? (
          <KpiCard
            title={title}
            value={data?.value || 0}
            aggregation={config.aggregation || 'SUM'}
            measureField={config.measureField}
            prefix={config.prefix}
            suffix={config.suffix}
            format={config.format || 'currency'}
            subtitle={config.subtitle}
            delta={config.delta}
          />
        ) : widgetType === 'table' ? (
          <DataTableWidget data={data || {}} height={260} />
        ) : (
          <ChartRenderer
            chartType={widgetType}
            data={data || {}}
            height={260}
          />
        )}
      </div>
    </div>
  );
}
