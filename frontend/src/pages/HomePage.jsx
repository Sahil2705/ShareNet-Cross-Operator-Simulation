import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { datasetService } from '../services/datasetService';
import { dashboardService } from '../services/dashboardService';
import { reportService } from '../services/reportService';
import { connectorService } from '../services/connectorService';
import { useToast } from '../context/ToastContext';
import {
  Database,
  FileBarChart,
  LayoutDashboard,
  Radio,
  Plus,
  UploadCloud,
  ArrowRight,
  ExternalLink,
  Trash2,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const [datasets, setDatasets] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dsRes, dbRes, rpRes] = await Promise.all([
        datasetService.getDatasets(),
        dashboardService.getDashboards(),
        reportService.getReports(),
      ]);
      setDatasets(dsRes.datasets || []);
      setDashboards(dbRes.dashboards || []);
      setReports(rpRes.reports || []);
    } catch (err) {
      console.error('Failed to load home page metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDeleteDataset = async (id, e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this dataset? The underlying MySQL table will also be removed.')) {
      return;
    }
    try {
      await datasetService.deleteDataset(id);
      addToast('Dataset deleted successfully', 'success');
      loadAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete dataset', 'error');
    }
  };

  const handleDeleteDashboard = async (id, e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await dashboardService.deleteDashboard(id);
      addToast('Dashboard deleted successfully', 'success');
      loadAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete dashboard', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-soft-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Power BI Simplified • MySQL Engine Ready</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Abhii Karke Deta Hu Workspace
          </h1>
          <p className="text-slate-300 text-xs lg:text-sm mt-1 max-w-xl leading-relaxed">
            Upload multi-source files, drag & drop fields into visual zones, and assemble real-time dashboards backed by MySQL.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to="/report-builder"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Create Report</span>
          </Link>
          <Link
            to="/data-sources"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700/80 hover:bg-brand-600 text-white font-semibold text-xs border border-brand-500/40 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Add Data Source</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Datasets
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{datasets.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Managed in MySQL dynamic tables</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saved Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileBarChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{reports.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Visual charts & KPI widgets</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dashboards
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{dashboards.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Interactive multi-widget views</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Connectors
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">14 Active</div>
          <p className="text-[11px] text-slate-400 mt-1">Files, DBs, Cloud & APIs</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/data-sources"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 group-hover:text-brand-600">
                Upload File
              </span>
              <span className="text-[10px] text-slate-400">Excel, CSV, JSON, PDF</span>
            </div>
          </Link>

          <Link
            to="/data-sources"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 group-hover:text-brand-600">
                Connect Database
              </span>
              <span className="text-[10px] text-slate-400">MySQL, Postgres, Mongo</span>
            </div>
          </Link>

          <Link
            to="/data-sources"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 group-hover:text-brand-600">
                Connect API
              </span>
              <span className="text-[10px] text-slate-400">REST or GraphQL</span>
            </div>
          </Link>

          <Link
            to="/report-builder"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 group-hover:text-brand-600">
                Create Report
              </span>
              <span className="text-[10px] text-slate-400">Visual drag-and-drop</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Dashboards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Dashboards</h2>
            <p className="text-xs text-slate-500">View and explore your interactive business dashboards</p>
          </div>
          <Link
            to="/dashboards"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {dashboards.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No dashboards created yet. Build a report first to create your dashboard!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dashboards.map((dash) => (
              <div
                key={dash.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                      {dash.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200/60 shrink-0">
                      {dash.widget_count || 0} Widgets
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {dash.description || 'Interactive multi-source analytics dashboard.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(dash.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteDashboard(dash.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Dashboard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/dashboards/${dash.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Datasets Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Datasets</h2>
            <p className="text-xs text-slate-500">Live data tables stored and indexed in MySQL</p>
          </div>
          <Link
            to="/datasets"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3">Dataset Name</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Rows</th>
                  <th className="px-5 py-3">Columns</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.slice(0, 5).map((ds) => (
                  <tr key={ds.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{ds.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ds.table_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                        {ds.source_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {ds.row_count?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{ds.column_count}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(ds.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/preview/${ds.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
                        >
                          Preview
                        </Link>
                        <Link
                          to={`/report-builder?datasetId=${ds.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
                        >
                          Create Report
                        </Link>
                        <button
                          onClick={(e) => handleDeleteDataset(ds.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
