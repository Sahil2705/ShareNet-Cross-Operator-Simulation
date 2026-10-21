import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { connectorService } from '../../services/connectorService';
import { useToast } from '../../context/ToastContext';

export default function ConnectionModal({ connector, isOpen, onClose, onImportSuccess }) {
  const { addToast } = useToast();
  const [config, setConfig] = useState({});
  const [datasetName, setDatasetName] = useState('');
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen || !connector) return null;

  const handleFieldChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await connectorService.testConnection(connector.type, config);
      setTestResult(res);
      if (res.success) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!datasetName.trim()) {
      addToast('Please provide a name for this dataset', 'error');
      return;
    }

    setImporting(true);
    try {
      const res = await connectorService.importConnectorData(
        connector.type,
        config,
        datasetName,
        `Imported from ${connector.name}`
      );
      if (res.success && res.dataset) {
        addToast(res.message, 'success');
        onImportSuccess(res.dataset);
        onClose();
      }
    } catch (err) {
      addToast(
        err.response?.data?.message || err.message || 'Failed to import data from connector',
        'error'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-soft-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Connect {connector.name}</h2>
            <p className="text-[11px] text-slate-400">Configure connection parameters & test reachability</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dataset Name in MySQL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={`e.g. ${connector.name} Analytics Sync`}
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Dynamic Connector Fields */}
          {connector.type === 'google-sheets' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Sheet Shareable URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={config.sheetUrl || ''}
                onChange={(e) => handleFieldChange('sheetUrl', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-mono text-[11px]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ensure spreadsheet sharing is set to "Anyone with the link can view".
              </p>
            </div>
          )}

          {(connector.type === 'mysql' || connector.type === 'postgresql') && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Host</label>
                  <input
                    type="text"
                    placeholder="localhost or db.host.com"
                    value={config.host || ''}
                    onChange={(e) => handleFieldChange('host', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="text"
                    placeholder={connector.type === 'mysql' ? '3306' : '5432'}
                    value={config.port || ''}
                    onChange={(e) => handleFieldChange('port', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">User</label>
                  <input
                    type="text"
                    placeholder="root or db_user"
                    value={config.user || ''}
                    onChange={(e) => handleFieldChange('user', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={config.password || ''}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Database</label>
                  <input
                    type="text"
                    placeholder="analytics_db"
                    value={config.database || ''}
                    onChange={(e) => handleFieldChange('database', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Table Name</label>
                  <input
                    type="text"
                    placeholder="orders_table"
                    value={config.tableName || ''}
                    onChange={(e) => handleFieldChange('tableName', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {connector.type === 'rest-api' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://api.example.com/v1/sales"
                  value={config.url || ''}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HTTP Method</label>
                  <select
                    value={config.method || 'GET'}
                    onChange={(e) => handleFieldChange('method', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Auth Type</label>
                  <select
                    value={config.authType || 'none'}
                    onChange={(e) => handleFieldChange('authType', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="none">No Auth (Public)</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="apikey">API Key Header</option>
                  </select>
                </div>
              </div>

              {config.authType === 'bearer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bearer Token</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={config.token || ''}
                    onChange={(e) => handleFieldChange('token', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {connector.type === 'graphql' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GraphQL Endpoint</label>
                <input
                  type="text"
                  placeholder="https://api.example.com/graphql"
                  value={config.url || ''}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GraphQL Query</label>
                <textarea
                  rows={4}
                  placeholder={`query {\n  allOrders {\n    id\n    product\n    amount\n  }\n}`}
                  value={config.query || ''}
                  onChange={(e) => handleFieldChange('query', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !datasetName.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {importing ? 'Importing...' : 'Import Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
