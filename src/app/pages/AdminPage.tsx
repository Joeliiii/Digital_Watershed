import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  Shield,
  Users,
  HardDrive,
  FileText,
  Download,
  UserPlus,
  Edit3,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  Database,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  File,
  Construction,
} from 'lucide-react';

type Tab = 'users' | 'storage' | 'audit' | 'export';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const categoryIcons: Record<string, any> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  application: FileCode,
  text: FileText,
  other: File,
  unknown: File,
};

const categoryColors: Record<string, string> = {
  image: 'bg-blue-100 text-blue-600',
  video: 'bg-purple-100 text-purple-600',
  audio: 'bg-amber-100 text-amber-600',
  application: 'bg-emerald-100 text-emerald-600',
  text: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-500',
  unknown: 'bg-gray-100 text-gray-500',
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // — Users state —
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // — Storage state —
  const [storageStats, setStorageStats] = useState<any>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  // Audit
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('all');

  // ───────────── FUNCTIONS ─────────────

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const data = await api.getAuditLogs({ page, limit: 20 });
      setAuditLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // TODO: Implement exportData in API service
      console.log('Export type:', exportType);
      alert('Export functionality not yet implemented');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // ───────────── EFFECTS ─────────────

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs(auditPage);
    }
  }, [activeTab, auditPage]);

  useEffect(() => {
    if (activeTab === 'storage' && !storageStats) {
      setStorageLoading(true);
      api.getStorageStats()
        .then(setStorageStats)
        .catch((err) => console.error('Failed to load storage:', err))
        .finally(() => setStorageLoading(false));
    }
  }, [activeTab, storageStats]);

  // ─── User handlers ──────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const newUser = await api.createUser(createForm);
      setUsers((prev) => [newUser, ...prev]);
      setShowCreateUser(false);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const startEditUser = (user: any) => {
    setEditingUserId(user._id);
    setEditForm({ name: user.name, email: user.email, role: user.role, password: '' });
  };

  const handleSaveUser = async () => {
    if (!editingUserId) return;
    try {
      const payload: any = { name: editForm.name, email: editForm.email, role: editForm.role };
      if (editForm.password) payload.password = editForm.password;
      const updated = await api.updateUser(editingUserId, payload);
      setUsers((prev) => prev.map((u) => (u._id === editingUserId ? updated : u)));
      setEditingUserId(null);
    } catch (err: any) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`)) return;
    try {
      await api.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err: any) {
      console.error('Failed to delete user:', err);
    }
  };

  // ─── Tab config ─────────────────────────────────
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'storage', label: 'Storage', icon: HardDrive },
    { key: 'audit', label: 'Audit Log', icon: FileText },
    { key: 'export', label: 'Bulk Export', icon: Download },
  ];

  // ───────────── RETURN ─────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-1 flex items-center gap-3">
            <Shield className="size-8" />
            Admin Panel
          </h1>
          <p className="text-gray-500">Manage users, monitor storage, and configure the system</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-blue-100 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════ USER MANAGEMENT ═══════════════ */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900">
                Users ({users.length})
              </h2>
              <button
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <UserPlus className="size-4" />
                Add User
              </button>
            </div>

            {/* Create user form */}
            {showCreateUser && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-4">Create New User</h3>
                {createError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    {createError}
                  </div>
                )}
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="user">User (Aid)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateUser(false)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users list */}
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-blue-100 text-center">
                <Users className="size-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No users found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {users.map((user) => {
                    const isEditing = editingUserId === user._id;
                    return (
                      <div key={user._id} className="p-4 hover:bg-blue-50/30 transition-colors">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Email</label>
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">New Password (optional)</label>
                              <input
                                type="text"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                placeholder="Leave blank to keep"
                                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={handleSaveUser}
                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                <Save className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                                  user.role === 'admin'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Mail className="size-3" />
                                  {user.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  Joined {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditUser(user)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit user"
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ STORAGE ═══════════════ */}
        {activeTab === 'storage' && (
          <div>
            {storageLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : !storageStats ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-blue-100 text-center">
                <HardDrive className="size-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Failed to load storage stats</p>
              </div>
            ) : (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                        <Database className="size-5" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Total File Storage</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatBytes(storageStats.files.totalFileSize)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      across {storageStats.files.totalFiles} files
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                        <FileText className="size-5" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Media Items</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {storageStats.counts.items}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600">
                        <Users className="size-5" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Total Users</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {storageStats.counts.users}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                        <HardDrive className="size-5" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium">DB Storage</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatBytes(storageStats.database.storageSize)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {storageStats.database.collections} collections
                    </div>
                  </div>
                </div>

                {/* Storage by type */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-blue-50">
                    <h3 className="text-sm font-semibold text-blue-900">Storage by File Type</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {Object.entries(storageStats.files.sizeByType as Record<string, { count: number; size: number }>)
                      .sort(([, a], [, b]) => b.size - a.size)
                      .map(([category, data]) => {
                        const Icon = categoryIcons[category] || File;
                        const colors = categoryColors[category] || categoryColors.other;
                        const pct = storageStats.files.totalFileSize > 0
                          ? ((data.size / storageStats.files.totalFileSize) * 100).toFixed(1)
                          : '0';
                        return (
                          <div key={category} className="px-6 py-3.5 flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${colors}`}>
                              <Icon className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-800 capitalize">{category}</span>
                                <span className="text-xs text-gray-500">
                                  {data.count} file{data.count !== 1 ? 's' : ''} · {formatBytes(data.size)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      category === 'image' ? '#3B82F6'
                                        : category === 'video' ? '#8B5CF6'
                                        : category === 'audio' ? '#F59E0B'
                                        : category === 'application' ? '#10B981'
                                        : '#9CA3AF',
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-400 w-12 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    {Object.keys(storageStats.files.sizeByType || {}).length === 0 && (
                      <div className="px-6 py-8 text-center text-gray-400 text-sm">
                        No files in storage
                      </div>
                    )}
                  </div>
                </div>

                {/* Entity counts */}
                <div className="mt-4 bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-4">Entity Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Items', value: storageStats.counts.items, color: 'text-blue-600' },
                      { label: 'Projects', value: storageStats.counts.projects, color: 'text-emerald-600' },
                      { label: 'Tags', value: storageStats.counts.tags, color: 'text-violet-600' },
                      { label: 'Users', value: storageStats.counts.users, color: 'text-amber-600' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center py-3 rounded-xl bg-gray-50">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ AUDIT LOG (Shell) ═══════════════ */}
        {activeTab === 'audit' && (
  <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-blue-50 flex justify-between">
      <h3 className="text-sm font-semibold text-blue-900">Audit Log</h3>
    </div>

    {auditLoading ? (
      <div className="p-10 text-center">Loading...</div>
    ) : (
      <div className="divide-y">
        {auditLogs.map((log) => (
          <div key={log._id} className="px-6 py-3 text-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-800">
                {log.user?.name || 'System'}
              </span>{' '}
              <span className="text-gray-500">
                {log.action} {log.entityType}
              </span>
              {log.entityName && (
                <span className="ml-1 text-blue-600">
                  "{log.entityName}"
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
              {(() => {
                const date = log.createdAt ? new Date(log.createdAt) : null;
                return date && !isNaN(date.getTime())
                  ? date.toLocaleString()
                  : '—';
              })()}
            </div>
          </div>
        ))}
      </div>
    )}
    {/* Pagination */}
    <div className="p-4 flex justify-between">
      <button 
        onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
        disabled={auditPage === 1}
      >
        Prev
      </button>
      <span className="text-sm text-gray-500">Page {auditPage}</span>
      <button 
        onClick={() => setAuditPage((p) => p + 1)}
        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
      >
        Next
      </button>
    </div>
  </div>
)}

        {/* ═══════════════ BULK EXPORT (Shell) ═══════════════ */}
        {activeTab === 'export' && (
  <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 max-w-xl">
    <h3 className="text-lg font-semibold text-blue-900 mb-4">
      Bulk Export
    </h3>

    <label className="block text-sm mb-2">Select Data Type</label>
    <select
      value={exportType}
      onChange={(e) => setExportType(e.target.value)}
      className="w-full mb-4 px-3 py-2 border rounded-lg"
    >
      <option value="all">Everything</option>
      <option value="items">Items</option>
      <option value="projects">Projects</option>
      <option value="users">Users</option>
    </select>

    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {exporting ? 'Exporting...' : 'Download ZIP'}
    </button>
  </div>
)}
      </div>
    </div>
  );
};

export default AdminPage;
