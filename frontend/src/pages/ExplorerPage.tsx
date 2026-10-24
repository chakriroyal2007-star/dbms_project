import React, { useState, useEffect } from 'react';
import { Database, Table, ChevronLeft, ChevronRight, Search, RefreshCw, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';

export const ExplorerPage: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('hospital');
  const [tableData, setTableData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get('/explorer/tables');
        setTables(res.data.tables);
      } catch (err) {
        console.error('Error fetching tables:', err);
      }
    };
    fetchTables();
  }, []);

  const fetchTableData = async (table: string, pageNum: number) => {
    try {
      setLoading(true);
      const offset = pageNum * limit;
      const res = await api.get(`/explorer/table/${table}?limit=${limit}&offset=${offset}`);
      setTableData(res.data);
    } catch (err) {
      console.error('Error fetching table records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  }, [selectedTable, page]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Database className="w-6 h-6 text-cyan-400" />
          <span>RELATIONAL DATABASE EXPLORER & SCHEMA INSPECTOR</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Live tabular record inspector across all 18 PostgreSQL tables, temporal history archives, and allocation logs.
        </p>
      </div>

      {/* Main Container: Sidebar of Tables + Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Selector Column */}
        <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2 shadow-xl">
          <div className="text-xs font-bold uppercase font-mono text-gray-400 mb-2 flex items-center space-x-1.5">
            <Table className="w-4 h-4 text-cyan-400" />
            <span>Core Tables ({tables.length})</span>
          </div>

          <div className="space-y-1 max-h-[560px] overflow-y-auto">
            {tables.map((tbl) => {
              const isCurrent = selectedTable === tbl;
              return (
                <button
                  key={tbl}
                  onClick={() => {
                    setSelectedTable(tbl);
                    setPage(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-md'
                      : 'text-gray-300 hover:bg-[#141C2E] hover:text-white border border-transparent'
                  }`}
                >
                  {tbl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Records Display Grid */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Top Bar: Table Info & Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F293D]">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-white font-mono uppercase">{selectedTable}</span>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {tableData?.total_records ?? 0} Total Records
                </span>
              </div>

              {/* Pagination */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1A2438] border border-[#1F293D] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-200" />
                </button>
                <span className="text-gray-400">
                  Page <strong className="text-white">{page + 1}</strong> of {Math.ceil((tableData?.total_records || 1) / limit)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={((page + 1) * limit) >= (tableData?.total_records || 0) || loading}
                  className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1A2438] border border-[#1F293D] disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 text-gray-200" />
                </button>
                <button
                  onClick={() => fetchTableData(selectedTable, page)}
                  className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1A2438] border border-[#1F293D]"
                  title="Refresh Table"
                >
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Records Data Table */}
            <div className="overflow-x-auto max-h-[480px] rounded-lg border border-[#1F293D]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141C2E] text-gray-400 uppercase text-[10px] sticky top-0 z-10 border-b border-[#1F293D]">
                  <tr>
                    {tableData?.columns?.map((col: string) => (
                      <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F293D] text-gray-300">
                  {loading ? (
                    <tr>
                      <td colSpan={tableData?.columns?.length || 5} className="p-8 text-center text-gray-400">
                        Loading relational records...
                      </td>
                    </tr>
                  ) : tableData?.rows?.length === 0 ? (
                    <tr>
                      <td colSpan={tableData?.columns?.length || 5} className="p-8 text-center text-gray-400">
                        No records found in table.
                      </td>
                    </tr>
                  ) : (
                    tableData?.rows?.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-[#141C2E]/60 transition-colors">
                        {tableData?.columns?.map((col: string) => {
                          const val = row[col];
                          const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                          return (
                            <td key={col} className="p-2.5 whitespace-nowrap max-w-[220px] truncate text-gray-200" title={strVal}>
                              {strVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
