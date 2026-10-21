import React, { useState, useEffect } from 'react';
import { datasetService } from '../../services/datasetService';
import { reportService } from '../../services/reportService';
import { X, Sparkles, Plus, BarChart3, Database } from 'lucide-react';

export default function AddWidgetModal({ isOpen, onClose, onAddWidget }) {
  const [datasets, setDatasets] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'reports'

  // Quick form state
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [title, setTitle] = useState('New Chart');
  const [widgetType, setWidgetType] = useState('column');
  const [dimensionField, setDimensionField] = useState('');
  const [measureField, setMeasureField] = useState('');
  const [aggregation, setAggregation] = useState('SUM');

  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      try {
        const [dsRes, repRes] = await Promise.all([
          datasetService.getDatasets(),
          reportService.getReports(),
        ]);
        setDatasets(dsRes.datasets || []);
        setReports(repRes.reports || []);

        if (dsRes.datasets && dsRes.datasets.length > 0) {
          setSelectedDatasetId(dsRes.datasets[0].id);
        }
      } catch (err) {
        console.error('Failed to load datasets/reports for modal:', err);
      }
    }
    loadData();
  }, [isOpen]);

  // Load columns when dataset changes
  useEffect(() => {
    if (!selectedDatasetId) return;
    async function fetchCols() {
      try {
        const res = await datasetService.getDataset(selectedDatasetId);
        const cols = res.dataset.columns || [];
        setDatasetColumns(cols);

        const numCol = cols.find((c) => c.dataType === 'number');
        const strCol = cols.find((c) => c.dataType === 'string' || c.dataType === 'date');
        if (numCol) setMeasureField(numCol.columnName);
        if (strCol) setDimensionField(strCol.columnName);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCols();
  }, [selectedDatasetId]);

  if (!isOpen) return null;

  const handleAddQuick = (e) => {
    e.preventDefault();
    onAddWidget({
      id: `widget-${Date.now()}`,
      dataset_id: selectedDatasetId,
      widget_type: widgetType,
      title: title || 'Custom Metric',
      configuration: {
        chartType: widgetType,
        dimensionField: widgetType === 'kpi' ? null : dimensionField,
        measureField: measureField,
        aggregation: aggregation,
        prefix: widgetType === 'kpi' && measureField.toLowerCase().includes('sale') ? '₹' : '',
        format: measureField.toLowerCase().includes('sale') ? 'currency' : 'number',
      },
      width: widgetType === 'kpi' ? 3 : 6,
      height: widgetType === 'kpi' ? 2 : 4,
    });
    onClose();
  };

  const handleAddReport = (report) => {
    onAddWidget({
      id: `widget-${Date.now()}`,
      dataset_id: report.dataset_id,
      widget_type: report.chart_type,
      title: report.name,
      configuration: report.configuration,
      width: report.chart_type === 'kpi' ? 3 : 6,
      height: report.chart_type === 'kpi' ? 2 : 4,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-soft-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Add Dashboard Widget</h2>
              <p className="text-[11px] text-slate-400">Add a new visual metric or saved report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-5 pt-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'quick'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Quick Configure
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'reports'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Saved Reports ({reports.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {activeTab === 'quick' ? (
            <form onSubmit={handleAddQuick} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Widget Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dataset</label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.row_count} rows)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Widget Type</label>
                <select
                  value={widgetType}
                  onChange={(e) => setWidgetType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="column">Column Chart (Vertical)</option>
                  <option value="bar">Bar Chart (Horizontal)</option>
                  <option value="line">Line Chart (Trend)</option>
                  <option value="donut">Donut Chart (Share)</option>
                  <option value="kpi">KPI Metric Card</option>
                  <option value="table">Summary Table</option>
                </select>
              </div>

              {widgetType !== 'kpi' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dimension (X Axis / Category)
                  </label>
                  <select
                    value={dimensionField}
                    onChange={(e) => setDimensionField(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    {datasetColumns.map((col) => (
                      <option key={col.columnName} value={col.columnName}>
                        {col.displayName || col.columnName} ({col.dataType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measure (Value)
                  </label>
                  <select
                    value={measureField}
                    onChange={(e) => setMeasureField(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    {datasetColumns.map((col) => (
                      <option key={col.columnName} value={col.columnName}>
                        {col.displayName || col.columnName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aggregation
                  </label>
                  <select
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="SUM">SUM</option>
                    <option value="AVG">AVG</option>
                    <option value="COUNT">COUNT</option>
                    <option value="MIN">MIN</option>
                    <option value="MAX">MAX</option>
                    <option value="DISTINCT_COUNT">DISTINCT COUNT</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
                >
                  Add Widget
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No saved reports yet. Create reports in Report Builder first.
                </div>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{r.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {r.chart_type} • {r.dataset_name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddReport(r)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
