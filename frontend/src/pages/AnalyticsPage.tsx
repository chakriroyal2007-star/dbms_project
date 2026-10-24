import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, PieChart as PieIcon, Activity, 
  Calendar, RefreshCw, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import api from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/summary');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>DISASTER ANALYTICS & TEMPORAL TRENDS HUB</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Relational PostgreSQL aggregations analyzing incident clusters, ICU depletion trends, fleet utilization, and corridor bottlenecks.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1C2538] border border-[#1F293D] text-xs font-medium text-gray-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Top Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ICU Availability Over Time Timeline */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase font-mono text-gray-200 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Regional ICU Availability vs. Surge Timeline</span>
                </h3>
                <span className="text-[10px] font-mono text-cyan-300">18:00 - 20:00 IST</span>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.icu_timeline}>
                    <defs>
                      <linearGradient id="icuColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="emColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', color: '#F3F4F6' }} />
                    <Area type="monotone" dataKey="icu_available" stroke="#06B6D4" fillOpacity={1} fill="url(#icuColor)" name="Available ICU Beds" />
                    <Area type="monotone" dataKey="emergency_available" stroke="#3B82F6" fillOpacity={1} fill="url(#emColor)" name="Emergency Beds" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hospital Bed Occupancy Distribution */}
            <div className="p-5 rounded-2xl bg-[#0E1524] border border-[#1F293D] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase font-mono text-gray-200 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Hospital Bed Occupancy by Key Facility</span>
                </h3>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hospital_capacity_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                    <XAxis dataKey="hospital" stroke="#9CA3AF" fontSize={10} angle={-15} textAnchor="end" height={50} />
                    <YAxis stroke="#9CA3AF" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', color: '#F3F4F6' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="icu_occupied" fill="#EF4444" name="ICU Occupied" stackId="a" />
                    <Bar dataKey="icu_available" fill="#06B6D4" name="ICU Available" stackId="a" />
                    <Bar dataKey="emergency_occupied" fill="#F59E0B" name="Emergency Occupied" stackId="b" />
                    <Bar dataKey="emergency_available" fill="#10B981" name="Emergency Available" stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Charts Grid (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Incidents by Severity */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <h3 className="text-xs font-bold uppercase font-mono text-gray-200">
                Incidents by Severity Breakdown
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.incidents_by_severity}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {data.incidents_by_severity.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ambulance Utilization */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <h3 className="text-xs font-bold uppercase font-mono text-gray-200">
                Ambulance Fleet Dispatch Status
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ambulance_utilization}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                    <XAxis dataKey="status" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D' }} />
                    <Bar dataKey="count" fill="#10B981" name="Fleet Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Critical Supplies Inventory */}
            <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F293D] space-y-2">
              <h3 className="text-xs font-bold uppercase font-mono text-gray-200">
                Trauma Supplies Consumption
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.resource_consumption} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                    <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
                    <YAxis dataKey="resource" type="category" stroke="#9CA3AF" fontSize={9} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D' }} />
                    <Bar dataKey="available" fill="#06B6D4" name="Stock" />
                    <Bar dataKey="consumed" fill="#EF4444" name="Used" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
