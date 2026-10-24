import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Activity, Key, CheckCircle2, 
  XCircle, Trash2, Edit3, RefreshCw, Clock, Database, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { authApi } from '../services/api';
import { ErrorState } from '../components/ErrorState';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  // New User Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('CONTROL_OPERATOR');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, logData] = await Promise.all([
        authApi.getUsers(),
        authApi.getAuditLogs(100),
      ]);
      setUsers(userData || []);
      setAuditLogs(logData || []);
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError(err?.response?.data?.detail || 'Failed to connect to user authentication database service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFeedbackMsg(null);
    try {
      await authApi.createUser({
        username: newUsername,
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setFeedbackMsg({ type: 'success', text: `User account '${newUsername}' successfully created in PostgreSQL!` });
      setShowCreateModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.response?.data?.detail || 'Failed to create user account.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await authApi.updateUser(user.user_id, { is_active: !user.is_active });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${username}' from database?`)) return;
    try {
      await authApi.deleteUser(userId);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await authApi.updateUser(userId, { role: newRole });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update user role.');
    }
  };

  if (error) {
    return <ErrorState title="ADMIN CONTROL CENTER ERROR" message={error} onRetry={fetchData} loading={loading} />;
  }

  const adminCount = users.filter((u) => u.role === 'ADMIN' || u.role === 'ADMINISTRATOR').length;
  const operatorCount = users.filter((u) => u.role === 'CONTROL_OPERATOR').length;
  const analystCount = users.filter((u) => u.role === 'ANALYST').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              ROLE: ADMINISTRATOR
            </span>
            <span className="text-[10px] font-mono text-gray-500">MASTER SYSTEM CONTROL</span>
          </div>
          <h1 className="text-2xl font-black text-gray-100 tracking-tight mt-1 flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            Admin Control Center & User Management
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Manage system users, RBAC permissions, and review the immutable PostgreSQL audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-900/40 transition-all cursor-pointer font-mono"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-3 rounded-lg text-xs font-mono border ${feedbackMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>TOTAL ACCOUNTS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-gray-100 font-mono">{users.length}</div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">Registered in user_account</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>ADMINISTRATORS</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{adminCount}</div>
          <div className="text-[10px] text-purple-500/80 font-mono mt-1">Full System Authority</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>CONTROL OPERATORS</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{operatorCount}</div>
          <div className="text-[10px] text-amber-500/80 font-mono mt-1">Triage & Dispatch Access</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>ANALYSTS</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">{analystCount}</div>
          <div className="text-[10px] text-emerald-500/80 font-mono mt-1">Read & Intelligence Access</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'users' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          USER ACCOUNTS ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'audit' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          SYSTEM AUDIT TRAIL ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Users Management Table */}
      {activeTab === 'users' && (
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-gray-950/80 text-gray-400 border-b border-gray-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Username / Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created At</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {users.map((u) => {
                  const roleStyle =
                    u.role === 'ADMIN' || u.role === 'ADMINISTRATOR'
                      ? 'bg-purple-950/50 text-purple-300 border-purple-800/40'
                      : u.role === 'CONTROL_OPERATOR'
                      ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                      : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40';

                  return (
                    <tr key={u.user_id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="font-bold text-gray-100 flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-cyan-400" />
                          {u.username}
                        </div>
                        <div className="text-[11px] text-gray-400">{u.full_name}</div>
                      </td>
                      <td className="p-3.5 text-gray-400">{u.email}</td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded border ${roleStyle} bg-transparent cursor-pointer`}
                        >
                          <option value="ADMINISTRATOR" className="bg-gray-900 text-purple-300">ADMINISTRATOR</option>
                          <option value="CONTROL_OPERATOR" className="bg-gray-900 text-amber-300">CONTROL_OPERATOR</option>
                          <option value="ANALYST" className="bg-gray-900 text-emerald-300">ANALYST</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer transition-all ${
                            u.is_active
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60'
                              : 'bg-red-950/60 text-red-400 border-red-800/50 hover:bg-red-900/60'
                          }`}
                        >
                          {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                        </button>
                      </td>
                      <td className="p-3.5 text-gray-500 text-[11px]">
                        {new Date(u.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right pr-4">
                        <button
                          onClick={() => handleDeleteUser(u.user_id, u.username)}
                          disabled={u.username === 'admin'}
                          className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Trail Stream */}
      {activeTab === 'audit' && (
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-gray-950/80 text-gray-400 border-b border-gray-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Timestamp</th>
                  <th className="p-3.5">User / Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5 pr-4">Payload Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No audit events recorded yet. Mutations to entities and allocations will appear here in real-time.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const actionBadge =
                      log.action === 'CREATE'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : log.action === 'UPDATE'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                        : log.action === 'DELETE'
                        ? 'bg-red-950/60 text-red-400 border-red-800/40'
                        : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40';

                    return (
                      <tr key={log.log_id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="p-3.5 pl-4 text-gray-400 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-gray-200">{log.username || 'SYSTEM'}</span>
                          <span className="text-[10px] text-gray-500 block">{log.user_role}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionBadge}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-cyan-300 font-semibold">{log.entity_name}</span>
                          <span className="text-[10px] text-gray-500 block">#{log.entity_id}</span>
                        </td>
                        <td className="p-3.5 text-gray-300 max-w-xs truncate">{log.details}</td>
                        <td className="p-3.5 pr-4">
                          {log.new_value_json ? (
                            <pre className="text-[10px] bg-black/60 p-1.5 rounded border border-gray-800 text-emerald-300 max-w-xs overflow-x-auto">
                              {JSON.stringify(log.new_value_json)}
                            </pre>
                          ) : (
                            <span className="text-gray-600 italic text-[10px]">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-base font-bold text-gray-100 mb-1 flex items-center gap-2 font-mono">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Create New User Account
            </h2>
            <p className="text-xs text-gray-400 font-mono mb-4">
              Add a new authenticated operator or analyst to the PostgreSQL DBMS.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. jdoe_ops"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. jdoe@tera.network"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Strong secret password"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CONTROL_OPERATOR">CONTROL_OPERATOR (Triage & Operational Dispatch)</option>
                  <option value="ANALYST">ANALYST (Intelligence & Safe Query Playground)</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR (Full Master Authority)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/40 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Save User to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
