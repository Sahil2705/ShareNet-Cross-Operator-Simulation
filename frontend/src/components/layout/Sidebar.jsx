import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Database,
  Radio,
  FileBarChart,
  LayoutDashboard,
  HardDrive,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'Data Sources', path: '/data-sources', icon: Radio },
    { name: 'Report Builder', path: '/report-builder', icon: FileBarChart },
    { name: 'Dashboards', path: '/dashboards', icon: LayoutDashboard },
  ];

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between py-4 select-none min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="px-3 space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Analytics Workspace
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 shadow-sm border border-brand-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Database & Architecture Status Footer */}
      <div className="px-4 pt-4 border-t border-slate-100 space-y-3">
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              MySQL Engine Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Dynamic table schema & parameterized aggregation queries enabled.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>v1.0.0 (Production)</span>
          <span className="text-slate-300">•</span>
          <span className="text-brand-600 font-medium">Power BI Simpler</span>
        </div>
      </div>
    </aside>
  );
}
