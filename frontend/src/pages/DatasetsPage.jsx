import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { datasetService } from '../services/datasetService';
import { useToast } from '../context/ToastContext';
import {
  Database,
  Search,
  Plus,
  Trash2,
  FileBarChart,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const res = await datasetService.getDatasets();
      setDatasets(res.datasets || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete dataset "${name}" and drop its MySQL table?`)) return;
    try {
      await datasetService.deleteDataset(id);
      addToast(`Dataset "${name}" deleted`, 'success');
      loadDatasets();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete dataset', 'error');
    }
  };

  const filteredDatasets = datasets.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.source_type.toLowerCase().includes(search.toLowerCase());
    const matchesSource =
      filterSource === 'ALL' || d.source_type.toLowerCase() === filterSource.toLowerCase();
    return matchesSearch && matchesSource;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-600" />
            Dataset Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, inspect, and manage datasets stored dynamically in MySQL
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDatasets}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-white border border-slate-200 shadow-soft-sm hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <Link
            to="/data-sources"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect / Upload Dataset</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search datasets by name or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'csv', 'xlsx', 'json', 'mysql', 'api'].map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                filterSource === src
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Datasets Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading datasets from MySQL...</span>
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No datasets found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload an Excel, CSV, or connect a live database to start analyzing.
          </p>
          <Link
            to="/data-sources"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Dataset</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDatasets.map((ds) => (
            <div
              key={ds.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg transition-all duration-200 flex flex-col justify-between group hover:border-brand-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                    {ds.source_type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                  {ds.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4 leading-relaxed">
                  {ds.description || 'Imported dataset stored in dedicated MySQL dynamic table.'}
                </p>

                {/* Metadata tags */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium py-2 border-t border-slate-100">
                  <span>
                    <strong className="text-slate-800">{ds.row_count?.toLocaleString()}</strong> rows
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-800">{ds.column_count}</strong> columns
                  </span>
                  <span>•</span>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                    {ds.table_name}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(ds.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
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
                    Build Report
                  </Link>
                  <button
                    onClick={() => handleDelete(ds.id, ds.name)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Dataset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
