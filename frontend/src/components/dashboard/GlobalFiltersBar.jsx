import React, { useState, useEffect } from 'react';
import { Filter, X, Plus } from 'lucide-react';
import { queryService } from '../../services/queryService';

export default function GlobalFiltersBar({
  datasetId,
  availableColumns = [],
  activeFilters = [],
  onFilterChange,
}) {
  const [selectedField, setSelectedField] = useState('');
  const [fieldValues, setFieldValues] = useState([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [loadingValues, setLoadingValues] = useState(false);

  // Load distinct values when user selects a field to filter on
  useEffect(() => {
    async function loadValues() {
      if (!selectedField || !datasetId) {
        setFieldValues([]);
        return;
      }
      setLoadingValues(true);
      try {
        const res = await queryService.getDistinctValues(datasetId, selectedField);
        setFieldValues(res.values || []);
      } catch (err) {
        console.warn('Failed to load filter distinct values:', err);
      } finally {
        setLoadingValues(false);
      }
    }
    loadValues();
  }, [selectedField, datasetId]);

  const handleAddFilter = () => {
    if (!selectedField || !selectedValue) return;

    // Replace or add
    const updated = activeFilters.filter((f) => f.field !== selectedField);
    updated.push({
      field: selectedField,
      operator: 'equals',
      value: selectedValue,
    });

    onFilterChange(updated);
    setSelectedField('');
    setSelectedValue('');
  };

  const handleRemoveFilter = (fieldName) => {
    const updated = activeFilters.filter((f) => f.field !== fieldName);
    onFilterChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-soft-sm flex flex-wrap items-center justify-between gap-3">
      {/* Left Active Filters Chips */}
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-1">
          <Filter className="w-3.5 h-3.5 text-brand-600" />
          <span>Dashboard Filters:</span>
        </div>

        {activeFilters.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No global filters active. Showing all data.</span>
        ) : (
          activeFilters.map((f) => (
            <span
              key={f.field}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200/60 text-xs font-semibold text-brand-800"
            >
              <span>{f.field}:</span>
              <span className="font-bold text-slate-900">{f.value}</span>
              <button
                onClick={() => handleRemoveFilter(f.field)}
                className="hover:text-rose-600 p-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Right Add Filter Controls */}
      {availableColumns.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">+ Add Filter Field...</option>
            {availableColumns.map((col) => (
              <option key={col.columnName} value={col.columnName}>
                {col.displayName || col.columnName}
              </option>
            ))}
          </select>

          {selectedField && (
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="">{loadingValues ? 'Loading values...' : 'Select value...'}</option>
              {fieldValues.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          )}

          {selectedField && selectedValue && (
            <button
              onClick={handleAddFilter}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
