import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function DataTableWidget({ data = {}, height = 360 }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const { rows = [], categories = [], values = [], dimensionField = '', measureField = '', secondaryMeasure = '' } = data;

  // Build unified table rows
  const tableRows = useMemo(() => {
    if (data.raw && Array.isArray(data.raw) && data.raw.length > 0) {
      return data.raw;
    }
    if (categories.length > 0) {
      return categories.map((cat, idx) => ({
        [dimensionField || 'Category']: cat,
        [measureField || 'Value']: values[idx],
      }));
    }
    return rows;
  }, [data, categories, values, dimensionField, measureField, rows]);

  const columns = useMemo(() => {
    if (tableRows.length === 0) return [];
    return Object.keys(tableRows[0]).filter((k) => k !== '_row_id');
  }, [tableRows]);

  const filteredRows = useMemo(() => {
    let result = [...tableRows];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return result;
  }, [tableRows, search, sortCol, sortAsc]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ maxHeight: height }}>
      {/* Search Header */}
      <div className="p-2.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {filteredRows.length} rows
        </span>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 text-slate-600 font-semibold sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3.5 py-2.5 border-b border-slate-200 cursor-pointer hover:bg-slate-200/60 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    {sortCol === col ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-brand-600" /> : <ArrowDown className="w-3 h-3 text-brand-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 hover:opacity-100" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col) => {
                  const val = row[col];
                  const isNum = typeof val === 'number';
                  return (
                    <td key={col} className={`px-3.5 py-2 text-slate-700 ${isNum ? 'font-mono' : ''}`}>
                      {val !== null && val !== undefined ? (isNum ? val.toLocaleString() : String(val)) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length || 1} className="p-8 text-center text-slate-400">
                  No records match your query
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
