import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { datasetService } from '../services/datasetService';
import { useToast } from '../context/ToastContext';

// Components
import DashboardWidget from '../components/dashboard/DashboardWidget';
import GlobalFiltersBar from '../components/dashboard/GlobalFiltersBar';
import AddWidgetModal from '../components/dashboard/AddWidgetModal';

// Icons
import {
  LayoutDashboard,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  Share2,
  Calendar,
  Sparkles,
  Printer,
  ChevronLeft,
} from 'lucide-react';

export default function DashboardViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [globalFilters, setGlobalFilters] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [primaryDatasetId, setPrimaryDatasetId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  // Load Dashboard Data
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getDashboardById(id);
      const dash = res.dashboard;
      setDashboard(dash);
      setWidgets(dash.widgets || []);
      setGlobalFilters(dash.global_filters || []);

      // Determine primary dataset ID from widgets
      const firstDatasetWidget = (dash.widgets || []).find((w) => w.dataset_id);
      if (firstDatasetWidget) {
        setPrimaryDatasetId(firstDatasetWidget.dataset_id);
        const dsRes = await datasetService.getDataset(firstDatasetWidget.dataset_id);
        setAvailableColumns(dsRes.dataset.columns || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      addToast(err.response?.data?.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Widget Title Rename
  const handleUpdateWidgetTitle = (widgetId, newTitle) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, title: newTitle } : w))
    );
  };

  // Widget Deletion
  const handleDeleteWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  // Add new widget from Modal
  const handleAddWidget = (newWidget) => {
    setWidgets((prev) => [...prev, newWidget]);
    addToast('Widget added to canvas. Click "Save Dashboard" to persist.', 'info');
  };

  // Save Dashboard State to MySQL
  const handleSaveDashboard = async () => {
    setSaving(true);
    try {
      const res = await dashboardService.saveFullDashboard(id, {
        name: dashboard.name,
        description: dashboard.description,
        global_filters: globalFilters,
        widgets: widgets,
      });
      addToast(res.message || 'Dashboard saved successfully!', 'success');
      if (res.dashboardId && res.dashboardId !== id) {
        navigate(`/dashboards/${res.dashboardId}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save dashboard', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Rendering dashboard canvas...</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-sm font-bold text-slate-700">Dashboard not found</h2>
      </div>
    );
  }

  // Separate KPI widgets vs Chart widgets for optimal layout arrangement
  const kpiWidgets = widgets.filter((w) => (w.widget_type || w.configuration?.chartType) === 'kpi');
  const chartWidgets = widgets.filter((w) => (w.widget_type || w.configuration?.chartType) !== 'kpi');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboards')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>All Dashboards</span>
          </button>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            {dashboard.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {dashboard.description || 'Multi-source analytics dashboard'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-soft-sm hover:bg-slate-50"
            title="Export / Print Dashboard"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddWidgetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-soft-sm transition-all"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Add Widget</span>
          </button>

          <button
            onClick={handleSaveDashboard}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm shadow-brand-600/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Global Filters Bar */}
      {availableColumns.length > 0 && (
        <GlobalFiltersBar
          datasetId={primaryDatasetId}
          availableColumns={availableColumns}
          activeFilters={globalFilters}
          onFilterChange={(newFilters) => setGlobalFilters(newFilters)}
        />
      )}

      {/* Dashboard Canvas Grid */}
      <div className="space-y-6">
        {/* KPI Top Row */}
        {kpiWidgets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {kpiWidgets.map((widget) => (
              <div key={widget.id} className="min-h-[140px]">
                <DashboardWidget
                  widget={widget}
                  globalFilters={globalFilters}
                  onDelete={handleDeleteWidget}
                  onUpdateTitle={handleUpdateWidgetTitle}
                />
              </div>
            ))}
          </div>
        )}

        {/* Charts and Tables Grid */}
        {chartWidgets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartWidgets.map((widget) => (
              <div key={widget.id} className="min-h-[380px]">
                <DashboardWidget
                  widget={widget}
                  globalFilters={globalFilters}
                  onDelete={handleDeleteWidget}
                  onUpdateTitle={handleUpdateWidgetTitle}
                />
              </div>
            ))}
          </div>
        )}

        {widgets.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Empty Dashboard Canvas</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first KPI metric, chart, or summary table to assemble your dashboard.
            </p>
            <button
              onClick={() => setIsAddWidgetOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Widget</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
}
