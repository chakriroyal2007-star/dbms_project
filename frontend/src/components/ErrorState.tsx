import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  loading?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "DATABASE CONNECTION ERROR",
  message = "Failed to query PostgreSQL database records. Ensure the backend engine and database are online.",
  onRetry,
  loading = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 m-4 rounded-xl border border-red-500/30 bg-red-950/20 backdrop-blur-md text-center max-w-lg mx-auto shadow-2xl">
      <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-4 animate-pulse">
        <Database className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-red-300 tracking-wider flex items-center gap-2 mb-2 font-mono">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        {title}
      </h3>
      <p className="text-xs text-gray-400 mb-6 leading-relaxed font-mono">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-900/40 transition-all cursor-pointer font-mono disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'RETRYING QUERY...' : 'RETRY DATABASE QUERY'}
        </button>
      )}
    </div>
  );
};
