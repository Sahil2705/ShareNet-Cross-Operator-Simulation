import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { datasetService } from '../services/datasetService';
import { useToast } from '../context/ToastContext';
import {
  Database,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Edit2,
  Table,
  Columns,
  Hash,
  Type,
  Calendar,
  ChevronLeft,
} from 'lucide-react';

export default function DataPreviewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isNewUpload = id === 'new';
  const uploadData = location.state?.uploadData;

  const [datasetName, setDatasetName] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [columnCount, setColumnCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNewUpload);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'columns'

  useEffect(() => {
    if (isNewUpload) {
      if (!uploadData) {
        navigate('/data-sources');
        return;
      }
      setDatasetName(uploadData.fileName ? uploadData.fileName.replace(/\.[^/.]+$/, '') : 'New Dataset');
      setColumns(
        uploadData.columns.map((c) => ({
          ...c,
          isVisible: true,
        }))
      );
      setRows(uploadData.previewRows || []);
      setRowCount(uploadData.rowCount || 0);
      setColumnCount(uploadData.columnCount || 0);
      setLoading(false);
    } else {
      // Load existing dataset preview
      async function loadExisting() {
        setLoading(true);
        try {
          const res = await datasetService.getDatasetPreview(id, { limit: 100 });
          setDatasetName(res.dataset.name);
          setColumns(res.dataset.columns || []);
          setRows(res.rows || []);
          setRowCount(res.total || 0);
          setColumnCount(res.dataset.columnCount || 0);
        } catch (err) {
          addToast(err.response?.data?.message || 'Failed to load dataset preview', 'error');
        } finally {
          setLoading(false);
        }
      }
      loadExisting();
    }
  }, [id, isNewUpload, uploadData, navigate]);

  const handleColumnUpdate = (colName, key, value) => {
    setColumns((prev) =>
      prev.map((c) => (c.columnName === colName ? { ...c, [key]: value } : c))
    );
  };

  const handleConfirmImport = async () => {
    setSaving(true);
    try {
      if (isNewUpload) {
        const res = await datasetService.confirmImport({
          uploadKey: uploadData.uploadKey,
          name: datasetName,
          sourceType: uploadData.sourceType,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          columns: columns,
        });
        addToast('Dataset successfully stored in MySQL!', 'success');
        navigate(`/report-builder?datasetId=${res.dataset.id}`);
      } else {
        await datasetService.updateColumns(id, columns);
        addToast('Column settings updated successfully', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to save dataset', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading dataset preview...</span>
      </div>
    );
  }

  const visibleColumns = columns.filter((c) => c.isVisible !== false);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-600" />
            {isNewUpload ? 'Validate & Confirm Import' : datasetName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {rowCount.toLocaleString()} rows • {columnCount} columns • Dynamic MySQL table
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isNewUpload && (
            <Link
              to={`/report-builder?datasetId=${id}`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open in Report Builder</span>
            </Link>
          )}

          {isNewUpload && (
            <button
              onClick={handleConfirmImport}
              disabled={saving || !datasetName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Creating MySQL Table...' : 'Confirm & Store in MySQL'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dataset Name Input (for new upload) */}
      {isNewUpload && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Dataset Name in MySQL
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full sm:max-w-md px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
            placeholder="Enter dataset name"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'table'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Data Table Preview ({rows.length} rows)</span>
        </button>
        <button
          onClick={() => setActiveTab('columns')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'columns'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>Column Metadata & Types ({columns.length})</span>
        </button>
      </div>

      {/* Tab 1: Table Preview */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-slate-400">#</th>
                  {visibleColumns.map((col) => (
                    <th key={col.columnName} className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">
                          {col.dataType === 'number' ? (
                            <Hash className="w-3.5 h-3.5 text-blue-500" />
                          ) : col.dataType === 'date' ? (
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Type className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </span>
                        <span>{col.displayName || col.columnName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">{rIdx + 1}</td>
                    {visibleColumns.map((col) => {
                      const val = row[col.columnName];
                      const isNum = typeof val === 'number';
                      return (
                        <td key={col.columnName} className={`px-4 py-2.5 text-slate-700 whitespace-nowrap ${isNum ? 'font-mono' : ''}`}>
                          {val !== null && val !== undefined ? String(val) : <span className="text-slate-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Column Inspector & Type Casting */}
      {activeTab === 'columns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Visible</th>
                  <th className="px-4 py-3">Column Key</th>
                  <th className="px-4 py-3">Display Name</th>
                  <th className="px-4 py-3">Data Type</th>
                  <th className="px-4 py-3">Null Values</th>
                  <th className="px-4 py-3">Unique Values</th>
                  <th className="px-4 py-3">Sample Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {columns.map((col) => (
                  <tr key={col.columnName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleColumnUpdate(col.columnName, 'isVisible', !col.isVisible)}
                        className={`p-1 rounded-lg ${col.isVisible ? 'text-brand-600 bg-brand-50' : 'text-slate-400 bg-slate-100'}`}
                      >
                        {col.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {col.columnName}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={col.displayName || col.columnName}
                        onChange={(e) => handleColumnUpdate(col.columnName, 'displayName', e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={col.dataType}
                        onChange={(e) => handleColumnUpdate(col.columnName, 'dataType', e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="string">String / Categorical</option>
                        <option value="number">Number / Numeric</option>
                        <option value="date">Date / Time</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{col.nullCount ?? 0}</td>
                    <td className="px-4 py-3 text-slate-500">{col.uniqueCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(col.sampleValues || []).map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[80px]"
                          >
                            {String(s)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
