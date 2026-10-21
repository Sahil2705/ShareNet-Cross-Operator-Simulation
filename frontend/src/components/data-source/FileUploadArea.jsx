import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { datasetService } from '../../services/datasetService';

export default function FileUploadArea({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const res = await datasetService.uploadFileAndPreview(file);
      if (res.success && res.data) {
        onUploadSuccess(res.data);
      } else {
        setError(res.message || 'Upload failed');
      }
    } catch (err) {
      console.error('File Upload Error:', err);
      setError(
        err.response?.data?.message || err.message || 'Unable to read this file. Please verify format.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10'
            : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50/60'
        } shadow-soft`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.json,.xml,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-100 to-indigo-50 text-brand-600 flex items-center justify-center shadow-inner">
            <UploadCloud className={`w-7 h-7 ${uploading ? 'animate-bounce text-brand-500' : ''}`} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">
              {uploading ? 'Parsing and analyzing file...' : 'Drag & Drop your file here'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              or <span className="text-brand-600 font-semibold hover:underline">browse files</span> from your computer
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['Excel (.xlsx, .xls)', 'CSV', 'JSON', 'XML', 'PDF'].map((fmt) => (
              <span
                key={fmt}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-700">Detecting columns and schema types...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
