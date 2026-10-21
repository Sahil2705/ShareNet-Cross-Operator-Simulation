import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  ArrowRight,
  Database,
  Sparkles,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    try {
      await demoLogin();
      navigate('/home');
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="h-20 border-b border-slate-800/80 px-6 lg:px-12 flex items-center justify-between backdrop-blur-md sticky top-0 z-40 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              Abhii Karke Deta Hu
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Analytics
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/home"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleDemoClick}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-brand-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Try Instant Demo</span>
              </button>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30"
              >
                <span>Get Started</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-16 pb-24 flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-brand-300 text-xs font-medium mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Simpler, cleaner, and faster analytics — inspired by Power BI</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          Turn your data into insights —{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400">
            without the complexity.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Connect multi-source data from Excel, CSV, databases, and APIs. Drag & drop fields into visual zones, generate smart charts automatically, and build interactive dashboards in seconds.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleDemoClick}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-600/40 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore Demo Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <Link
            to="/register"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-all"
          >
            <span>Get Started Free</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm hover:border-slate-600 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Connect 14+ Data Sources</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Native connectors for Excel (.xlsx, .xls), CSV, JSON, XML, PDF, MySQL, PostgreSQL, MongoDB, Google Sheets, Drive, and REST APIs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm hover:border-slate-600 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Visual Drag & Drop Builder</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Drag categorical fields to X Axis and numerical measures to Y Axis. Instant aggregations with SUM, AVG, COUNT, MIN, and MAX.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm hover:border-slate-600 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dynamic MySQL Storage</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Uploaded datasets create dynamic MySQL tables automatically. Powered by safe parameterized queries and lightning-fast aggregations.
            </p>
          </div>
        </div>

        {/* Process Flow Banner */}
        <div className="mt-16 w-full max-w-4xl p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[11px]">1</span>
              <span>Connect Data</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[11px]">2</span>
              <span>Preview & Inspect</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[11px]">3</span>
              <span>Drag & Drop Fields</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[11px]">4</span>
              <span>Generate Charts</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[11px]">5</span>
              <span>Build Dashboard</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Abhii Karke Deta Hu. Built with React, Vite, Node.js, Express, and MySQL.</p>
      </footer>
    </div>
  );
}
