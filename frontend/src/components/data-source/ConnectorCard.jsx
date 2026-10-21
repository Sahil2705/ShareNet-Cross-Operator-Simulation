import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Code2,
  FileDigit,
  Database,
  Server,
  Layers,
  Sheet,
  HardDrive,
  Cloud,
  Box,
  Archive,
  Globe,
  Zap,
  ArrowRight,
} from 'lucide-react';

const iconMap = {
  FileSpreadsheet,
  FileText,
  FileCode,
  Code2,
  FileDigit,
  Database,
  Server,
  Layers,
  Sheet,
  HardDrive,
  Cloud,
  Box,
  Archive,
  Globe,
  Zap,
};

export default function ConnectorCard({ connector, onConnect, onUploadClick }) {
  const Icon = iconMap[connector.icon] || Database;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg transition-all duration-200 flex flex-col justify-between group hover:border-brand-300">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
            {connector.category}
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
          {connector.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {connector.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          {connector.format || 'Live Connection'}
        </span>

        {connector.isUpload ? (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <span>Upload</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onConnect(connector)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
          >
            <span>Connect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
