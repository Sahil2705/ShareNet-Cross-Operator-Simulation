import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';

export default function DashboardsListPage() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getDashboards();
      setDashboards(res.dashboards || []);
    } catch (err) {
      addToast('Failed to load dashboards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await dashboardService.createDashboard({
        name: newTitle,
        description: newDesc,
      });
      addToast('Dashboard created!', 'success');
      navigate(`/dashboards/${res.dashboardId}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create dashboard', 'error');
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await dashboardService.deleteDashboard(id);
      addToast('Dashboard deleted', 'success');
      loadDashboards();
    } catch (err) {
      addToast('Failed to delete dashboard', 'error');
    }
  };

  const filtered = dashboards.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            Saved Dashboards
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Open, manage, and arrange your multi-visualization analytics boards
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Dashboard</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dashboards by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Create New Dashboard</h3>
            <p className="text-xs text-slate-500 mb-4">Give your dashboard a title and description</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dashboard Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Executive Sales Dashboard"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Key performance indicators and charts tracking revenue by region..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading dashboards...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No dashboards found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first dashboard to arrange charts and KPI cards together.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Dashboard</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dash) => (
            <div
              key={dash.id}
              onClick={() => navigate(`/dashboards/${dash.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:border-brand-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200/60">
                    {dash.widget_count || 0} Widgets
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                  {dash.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4 leading-relaxed">
                  {dash.description || 'Interactive multi-source analytics dashboard.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(dash.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDelete(dash.id, dash.name, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Dashboard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
