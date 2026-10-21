import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { datasetService } from '../services/datasetService';
import { queryService } from '../services/queryService';
import { reportService } from '../services/reportService';
import { dashboardService } from '../services/dashboardService';
import { useToast } from '../context/ToastContext';

// Components
import DraggableField from '../components/report-builder/DraggableField';
import DropZone from '../components/report-builder/DropZone';
import ChartTypePicker from '../components/report-builder/ChartTypePicker';
import ChartRenderer from '../components/charts/ChartRenderer';
import KpiCard from '../components/charts/KpiCard';
import DataTableWidget from '../components/charts/DataTableWidget';

// Icons
import {
  FileBarChart,
  Search,
  Sparkles,
  Save,
  Plus,
  RefreshCw,
  Table,
  BarChart3,
  Download,
  RotateCcw,
  Sliders,
  Filter,
  Check,
} from 'lucide-react';

export default function ReportBuilderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Datasets State
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(searchParams.get('datasetId') || '');
  const [dataset, setDataset] = useState(null);
  const [fieldSearch, setFieldSearch] = useState('');

  // Report Configuration
  const [reportTitle, setReportTitle] = useState('New Report');
  const [chartType, setChartType] = useState('column');
  const [xAxisField, setXAxisField] = useState(null); // Dimension
  const [yAxisField, setYAxisField] = useState(null); // Measure
  const [aggregation, setAggregation] = useState('SUM');
  const [legendField, setLegendField] = useState(null); // Secondary Dimension
  const [filterField, setFilterField] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [filterDistinctValues, setFilterDistinctValues] = useState([]);

  // Recommendations & View
  const [recommendations, setRecommendations] = useState([]);
  const [activeView, setActiveView] = useState('chart'); // 'chart' | 'table'
  const [activeDragItem, setActiveDragItem] = useState(null);

  // Live Query Data State
  const [queryData, setQueryData] = useState(null);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load initial datasets list
  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await datasetService.getDatasets();
        const list = res.datasets || [];
        setDatasets(list);

        if (!selectedDatasetId && list.length > 0) {
          setSelectedDatasetId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      }
    }
    loadDatasets();
  }, []);

  // 2. Load dataset details and columns when selectedDatasetId changes
  useEffect(() => {
    if (!selectedDatasetId) return;

    async function loadDatasetDetails() {
      try {
        const res = await datasetService.getDataset(selectedDatasetId);
        const ds = res.dataset;
        setDataset(ds);

        // Auto-assign default dimension & measure if none selected
        const cols = ds.columns || [];
        const numCol = cols.find((c) => c.dataType === 'number');
        const catCol = cols.find((c) => c.dataType === 'string' || c.dataType === 'date');

        if (catCol && !xAxisField) setXAxisField(catCol);
        if (numCol && !yAxisField) setYAxisField(numCol);
      } catch (err) {
        console.error('Failed to load dataset columns:', err);
      }
    }
    loadDatasetDetails();
  }, [selectedDatasetId]);

  // 3. Fetch AI / Rule-based Recommendations
  useEffect(() => {
    if (!selectedDatasetId || (!xAxisField && !yAxisField)) return;

    async function fetchRecommendations() {
      try {
        const res = await queryService.getRecommendations(
          selectedDatasetId,
          xAxisField?.columnName,
          yAxisField?.columnName
        );
        setRecommendations(res.recommendations || []);
      } catch (err) {
        console.warn('Failed to load recommendations:', err);
      }
    }
    fetchRecommendations();
  }, [selectedDatasetId, xAxisField, yAxisField]);

  // 4. Load distinct values for filter if filter field is active
  useEffect(() => {
    if (!selectedDatasetId || !filterField) {
      setFilterDistinctValues([]);
      return;
    }
    async function fetchFilterValues() {
      try {
        const res = await queryService.getDistinctValues(selectedDatasetId, filterField.columnName);
        setFilterDistinctValues(res.values || []);
      } catch (e) {
        console.warn(e);
      }
    }
    fetchFilterValues();
  }, [selectedDatasetId, filterField]);

  // 5. Live Query Engine: Re-execute whenever fields, aggregation, or filters change
  const executeQuery = useCallback(async () => {
    if (!selectedDatasetId) return;
    if (!xAxisField && !yAxisField) {
      setQueryData(null);
      return;
    }

    setLoadingQuery(true);
    try {
      const filters = [];
      if (filterField && filterValue) {
        filters.push({
          field: filterField.columnName,
          operator: 'equals',
          value: filterValue,
        });
      }

      const res = await queryService.executeAggregation(selectedDatasetId, {
        dimensionField: xAxisField?.columnName || null,
        measureField: yAxisField?.columnName || null,
        aggregation: aggregation,
        secondaryDimension: legendField?.columnName || null,
        filters,
      });

      setQueryData(res);
    } catch (err) {
      console.error('Query execution error:', err);
      setQueryData(null);
    } finally {
      setLoadingQuery(false);
    }
  }, [selectedDatasetId, xAxisField, yAxisField, aggregation, legendField, filterField, filterValue]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Drag and drop handlers
  const handleDragStart = (event) => {
    setActiveDragItem(event.active.data.current?.field);
  };

  const handleDragEnd = (event) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const droppedField = active.data.current.field;
    const zoneId = over.id;

    if (zoneId === 'zone-xAxis') {
      setXAxisField(droppedField);
    } else if (zoneId === 'zone-yAxis') {
      setYAxisField(droppedField);
      if (droppedField.dataType === 'number') {
        setAggregation('SUM');
      } else {
        setAggregation('COUNT');
      }
    } else if (zoneId === 'zone-legend') {
      setLegendField(droppedField);
    } else if (zoneId === 'zone-filters') {
      setFilterField(droppedField);
    }
  };

  // Quick Add helper
  const handleQuickAdd = (field) => {
    if (field.dataType === 'number') {
      setYAxisField(field);
    } else {
      setXAxisField(field);
    }
  };

  // Reset Configuration
  const handleReset = () => {
    setXAxisField(null);
    setYAxisField(null);
    setLegendField(null);
    setFilterField(null);
    setFilterValue('');
    setChartType('column');
  };

  // Save Report
  const handleSaveReport = async () => {
    if (!reportTitle.trim()) {
      addToast('Please enter a title for this report', 'error');
      return;
    }
    setSaving(true);
    try {
      await reportService.createReport({
        datasetId: selectedDatasetId,
        name: reportTitle,
        chartType,
        configuration: {
          chartType,
          dimensionField: xAxisField?.columnName,
          measureField: yAxisField?.columnName,
          aggregation,
          secondaryDimension: legendField?.columnName,
          filters: filterField && filterValue ? [{ field: filterField.columnName, operator: 'equals', value: filterValue }] : [],
        },
      });
      addToast('Report saved successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save report', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add to Dashboard
  const handleAddToDashboard = async () => {
    try {
      const dbRes = await dashboardService.getDashboards();
      const list = dbRes.dashboards || [];

      let targetDashboardId;
      if (list.length > 0) {
        targetDashboardId = list[0].id;
      } else {
        const created = await dashboardService.createDashboard({
          name: 'My Analytics Dashboard',
          description: 'Created from Report Builder',
        });
        targetDashboardId = created.dashboardId;
      }

      await dashboardService.addWidget(targetDashboardId, {
        dataset_id: selectedDatasetId,
        widget_type: chartType,
        title: reportTitle,
        configuration: {
          chartType,
          dimensionField: xAxisField?.columnName,
          measureField: yAxisField?.columnName,
          aggregation,
          secondaryDimension: legendField?.columnName,
          prefix: chartType === 'kpi' && yAxisField?.columnName.toLowerCase().includes('sale') ? '₹' : '',
        },
        width: chartType === 'kpi' ? 3 : 6,
        height: chartType === 'kpi' ? 2 : 4,
      });

      addToast('Widget added to Dashboard!', 'success');
      navigate(`/dashboards/${targetDashboardId}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add to dashboard', 'error');
    }
  };

  // Filter columns by search
  const availableColumns = (dataset?.columns || []).filter((c) =>
    (c.displayName || c.columnName).toLowerCase().includes(fieldSearch.toLowerCase())
  );

  const dimensionColumns = availableColumns.filter((c) => c.dataType !== 'number');
  const measureColumns = availableColumns.filter((c) => c.dataType === 'number');

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-soft-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <FileBarChart className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="text-sm font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-brand-500 rounded-lg px-2 py-1 focus:outline-none transition-all"
              placeholder="Report Title"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Chart vs Table */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setActiveView('chart')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'chart'
                    ? 'bg-white text-brand-700 shadow-soft-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'table'
                    ? 'bg-white text-brand-700 shadow-soft-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Data</span>
              </button>
            </div>

            <button
              onClick={handleReset}
              title="Reset configuration"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveReport}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Report</span>
            </button>

            <button
              onClick={handleAddToDashboard}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Dashboard</span>
            </button>
          </div>
        </div>

        {/* 3-Column Report Builder Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Fields Panel (Left) */}
          <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            {/* Dataset Selector */}
            <div className="p-3 border-b border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Active Dataset
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Fields List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Dimensions */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Dimensions ({dimensionColumns.length})
                </span>
                <div className="space-y-1.5">
                  {dimensionColumns.map((field) => (
                    <DraggableField key={field.columnName} field={field} onQuickAdd={handleQuickAdd} />
                  ))}
                  {dimensionColumns.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">No dimension columns</p>
                  )}
                </div>
              </div>

              {/* Measures */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Measures ({measureColumns.length})
                </span>
                <div className="space-y-1.5">
                  {measureColumns.map((field) => (
                    <DraggableField key={field.columnName} field={field} onQuickAdd={handleQuickAdd} />
                  ))}
                  {measureColumns.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">No numeric measure columns</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Center Canvas (Chart Preview) */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">
            {/* Recommendations Bar */}
            {recommendations.length > 0 && (
              <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Smart Suggestions:
                </span>
                {recommendations.map((rec) => (
                  <button
                    key={rec.chartType}
                    onClick={() => setChartType(rec.chartType)}
                    className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 transition-all ${
                      chartType === rec.chartType
                        ? 'bg-brand-600 text-white shadow-sm'
                        : rec.recommended
                        ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {rec.recommended && !chartType === rec.chartType ? '★ ' : ''}
                    {rec.title}
                  </button>
                ))}
              </div>
            )}

            {/* Main Canvas Container */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 flex flex-col justify-between relative min-h-[420px]">
              {loadingQuery ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Aggregating MySQL dataset...</span>
                </div>
              ) : activeView === 'table' ? (
                <DataTableWidget data={queryData || {}} height={440} />
              ) : chartType === 'kpi' ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-md w-full">
                    <KpiCard
                      title={reportTitle}
                      value={queryData?.value || 0}
                      aggregation={aggregation}
                      measureField={yAxisField?.displayName || yAxisField?.columnName}
                      prefix={yAxisField?.columnName.toLowerCase().includes('sale') ? '₹' : ''}
                      format={yAxisField?.columnName.toLowerCase().includes('sale') ? 'currency' : 'number'}
                      subtitle={`Calculated over ${dataset?.row_count?.toLocaleString()} rows`}
                    />
                  </div>
                </div>
              ) : (
                <ChartRenderer
                  chartType={chartType}
                  data={queryData || {}}
                  height={440}
                  title={reportTitle}
                />
              )}

              {/* Canvas Bottom Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Source: <strong>{dataset?.name}</strong> • Table: <code>{dataset?.table_name}</code>
                </span>
                <span>Auto-refreshed via MySQL 8.0</span>
              </div>
            </div>
          </div>

          {/* Column 3: Properties & Drop Zones (Right) */}
          <div className="w-72 bg-white border-l border-slate-200 p-4 flex flex-col gap-5 overflow-y-auto shrink-0">
            {/* Chart Type Selector */}
            <ChartTypePicker
              selectedType={chartType}
              onSelectType={(t) => setChartType(t)}
              recommendedTypes={recommendations}
            />

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Configuration Drop Zones
              </span>

              {/* Zone 1: X Axis / Category */}
              <DropZone
                id="zone-xAxis"
                title="X Axis / Category"
                subtitle="Dimensions"
                field={xAxisField}
                onRemove={() => setXAxisField(null)}
              />

              {/* Zone 2: Y Axis / Values */}
              <DropZone
                id="zone-yAxis"
                title="Y Axis / Values"
                subtitle="Measures"
                field={yAxisField}
                aggregation={aggregation}
                showAggregation={true}
                onAggregationChange={(agg) => setAggregation(agg)}
                onRemove={() => setYAxisField(null)}
              />

              {/* Zone 3: Legend / Group By */}
              {chartType !== 'kpi' && (
                <DropZone
                  id="zone-legend"
                  title="Legend / Group By"
                  subtitle="Secondary Dimension"
                  field={legendField}
                  onRemove={() => setLegendField(null)}
                />
              )}

              {/* Zone 4: Filters */}
              <DropZone
                id="zone-filters"
                title="Filter by Field"
                subtitle="Value Filter"
                field={filterField}
                onRemove={() => {
                  setFilterField(null);
                  setFilterValue('');
                }}
              />

              {/* Filter Value Picker if Filter Field dropped */}
              {filterField && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Select Filter Value:
                  </label>
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                  >
                    <option value="">(All Values)</option>
                    {filterDistinctValues.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && (
            <div className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold text-xs shadow-lg opacity-90">
              {activeDragItem.displayName || activeDragItem.columnName}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
