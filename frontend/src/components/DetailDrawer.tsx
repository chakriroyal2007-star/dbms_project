import React from 'react';
import { X, Database, Tag, Clock, MapPin, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: Record<string, any> | null;
  entityType: string;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  entityType,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-xl h-full bg-[#0B1120] border-l border-cyan-500/20 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-800/80 bg-gradient-to-r from-gray-900 via-gray-900/90 to-[#0B1120] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {entityType.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-gray-500">POSTGRESQL RELATIONAL ENTITY</span>
              </div>
              <h2 className="text-base font-bold text-gray-100 tracking-wide mt-1 truncate max-w-sm">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-gray-400 font-mono mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/60 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Attributes Section */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 font-mono tracking-wider uppercase mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              Relational Attributes & Schema Columns
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(data).map(([key, val]) => {
                if (typeof val === 'object' && val !== null) return null;
                return (
                  <div key={key} className="bg-black/40 border border-gray-800/60 p-2.5 rounded-lg">
                    <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono font-semibold text-gray-200 break-all text-xs">
                      {val === null || val === undefined ? (
                        <span className="text-gray-600 italic">NULL</span>
                      ) : typeof val === 'boolean' ? (
                        val ? (
                          <span className="text-emerald-400">TRUE</span>
                        ) : (
                          <span className="text-gray-400">FALSE</span>
                        )
                      ) : (
                        String(val)
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nested Objects or Collections */}
          {Object.entries(data).map(([key, val]) => {
            if (typeof val !== 'object' || val === null) return null;
            return (
              <div key={key} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-400 font-mono tracking-wider uppercase mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" />
                  {key.replace(/_/g, ' ')} (Relation Sub-Dataset)
                </h3>
                <pre className="p-3 bg-black/60 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto border border-gray-800/80">
                  {JSON.stringify(val, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-950 flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>PostgreSQL Synchronized</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
