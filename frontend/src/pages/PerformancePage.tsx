import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, Database, ArrowRight, CheckCircle2, 
  AlertTriangle, Play, RefreshCw, Terminal, Activity 
} from 'lucide-react';
import api from '../services/api';

export const PerformancePage: React.FC = () => {
  const [benchmarkType, setBenchmarkType] = useState('temporal_lookup');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const runExplain = async (typeToRun?: string) => {
    const type = typeToRun || benchmarkType;
    try {
      setLoading(true);
      const res = await api.get(`/performance/explain?benchmark_type=${type}`);
      setResult(res.data);
    } catch (err) {
      console.error('Error running performance explain:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runExplain('temporal_lookup');
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <span>DATABASE PERFORMANCE & EXPLAIN ANALYZE LABORATORY</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Benchmark relational execution plans, composite B-Tree index acceleration, and buffer cache hit rates on high-volume synthetic datasets.
        </p>
      </div>

      {/* Benchmark Selector Matrix */}
      <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase font-mono text-gray-400">Benchmark Target:</span>
          {[
            { id: 'temporal_lookup', label: '1. Temporal GPS Trajectory Range Scan' },
            { id: 'spatial_distance', label: '2. CTE Multi-Stage Window Function Ranking' },
            { id: 'resource_shortage', label: '3. Group By / Having Shortage Aggregate' },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setBenchmarkType(b.id);
                runExplain(b.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                benchmarkType === b.id
                  ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50'
                  : 'bg-[#141C2E] border border-[#1F293D] text-gray-300 hover:border-gray-600'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => runExplain()}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all font-mono"
        >
          <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'fill-black'}`} />
          <span>{loading ? 'Executing EXPLAIN...' : 'RE-RUN EXPLAIN ANALYZE'}</span>
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* SQL Query Box */}
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1F293D] font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400 text-[11px] pb-1 border-b border-[#1F293D]">
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <Terminal className="w-4 h-4" />
                <span>Executed SQL Query Plan</span>
              </span>
              <span>Engine: {result.database_engine} • Live DB Ping: {result.live_ping_ms} ms</span>
            </div>
            <pre className="text-gray-200 overflow-x-auto whitespace-pre-wrap p-2 bg-[#070B14] rounded-lg border border-[#1F293D]/60 text-[11px] text-cyan-300">
              {result.sql_query}
            </pre>
          </div>

          {/* Speedup Callout Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-[#0E1524] to-cyan-950/80 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-base font-black text-white font-mono">
                  INDEX ACCELERATION FACTOR: <span className="text-emerald-400">{result.speedup_factor}</span>
                </h3>
                <p className="text-xs text-gray-300">
                  PostgreSQL B-Tree composite index eliminates expensive sequential disk scans and sorting overhead.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded border border-emerald-500/40 font-bold">
              VERIFIED 3NF INDEXING
            </div>
          </div>

          {/* Side-by-Side EXPLAIN Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Indexed Execution Plan */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
                <span className="text-xs font-bold uppercase font-mono text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WITH COMPOSITE B-TREE INDEX (OPTIMAL)</span>
                </span>
                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {result.indexed_plan.execution_time_ms} ms
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Scan Operation:</span>
                  <span className="text-white font-semibold">{result.indexed_plan.scan_type}</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Index Employed:</span>
                  <span className="text-cyan-400 font-semibold">{result.indexed_plan.index_used}</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Cost Estimate:</span>
                  <span className="text-gray-200">{result.indexed_plan.estimated_cost}</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Buffer Cache Hit:</span>
                  <span className="text-emerald-400 font-bold">{result.indexed_plan.buffer_hit_percent}%</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Planning Time:</span>
                  <span className="text-gray-300">{result.indexed_plan.planning_time_ms} ms</span>
                </div>
              </div>
            </div>

            {/* Unindexed Sequential Scan Plan */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-rose-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
                <span className="text-xs font-bold uppercase font-mono text-rose-400 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>WITHOUT INDEX (SEQUENTIAL TABLE SCAN)</span>
                </span>
                <span className="text-xs font-mono font-black text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                  {result.unindexed_plan.execution_time_ms} ms
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Scan Operation:</span>
                  <span className="text-rose-300 font-semibold">{result.unindexed_plan.scan_type}</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Index Employed:</span>
                  <span className="text-gray-500">{result.unindexed_plan.index_used}</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Cost Estimate:</span>
                  <span className="text-rose-400">{result.unindexed_plan.estimated_cost}</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Buffer Cache Hit:</span>
                  <span className="text-amber-400 font-bold">{result.unindexed_plan.buffer_hit_percent}%</span>
                </div>
                <div className="p-2.5 rounded bg-[#141C2E] border border-[#1F293D] flex justify-between">
                  <span className="text-gray-400">Planning Time:</span>
                  <span className="text-gray-300">{result.unindexed_plan.planning_time_ms} ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
