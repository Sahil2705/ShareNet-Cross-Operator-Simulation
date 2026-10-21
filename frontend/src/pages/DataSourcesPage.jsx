import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectorService } from '../services/connectorService';
import FileUploadArea from '../components/data-source/FileUploadArea';
import ConnectorCard from '../components/data-source/ConnectorCard';
import ConnectionModal from '../components/data-source/ConnectionModal';
import { useToast } from '../context/ToastContext';
import { Radio, Sparkles, Filter } from 'lucide-react';

export default function DataSourcesPage() {
  const [connectors, setConnectors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeModalConnector, setActiveModalConnector] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadConnectors() {
      try {
        const res = await connectorService.listConnectors();
        setConnectors(res.connectors || []);
      } catch (err) {
        console.error('Failed to load connectors:', err);
      }
    }
    loadConnectors();
  }, []);

  const handleUploadSuccess = (uploadData) => {
    // Navigate to preview page with uploaded data in state
    navigate('/preview/new', { state: { uploadData } });
  };

  const handleConnectClick = (connector) => {
    setActiveModalConnector(connector);
    setIsModalOpen(true);
  };

  const handleImportSuccess = (dataset) => {
    navigate(`/preview/${dataset.id}`);
  };

  const categories = ['ALL', 'Files', 'Databases', 'Cloud', 'APIs'];

  const filteredConnectors = connectors.filter(
    (c) => selectedCategory === 'ALL' || c.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Radio className="w-6 h-6 text-brand-600" />
          Data Sources & Connectors
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload spreadsheets, extract from PDFs, connect live databases, cloud drives, or REST & GraphQL APIs
        </p>
      </div>

      {/* File Upload Hero Drop Zone */}
      <div className="bg-gradient-to-tr from-slate-50 to-brand-50/40 p-6 sm:p-8 rounded-3xl border border-brand-200/50 shadow-soft">
        <div className="max-w-xl mx-auto">
          <FileUploadArea onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {filteredConnectors.length} connectors available
        </span>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredConnectors.map((conn) => (
          <ConnectorCard
            key={conn.type}
            connector={conn}
            onConnect={handleConnectClick}
            onUploadClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        ))}
      </div>

      {/* Live Connection Modal */}
      <ConnectionModal
        connector={activeModalConnector}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
