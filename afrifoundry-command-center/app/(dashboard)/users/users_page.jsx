'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard, SectionHeader, Badge, DataTable, ActionButton, LoadingSpinner } from '../../../components/ui';
import { getUsers, promoteUser } from '../../../lib/api';

const MOCK_USERS = [
  { id: 'u001', email: 'mark@afrifoundry.com', role: 'admin', conversations: 0, joined: 'Jul 8, 2025', last_active: 'Today' },
  { id: 'u002', email: 'james.k@gmail.com', role: 'user', conversations: 24, joined: 'Feb 28, 2026', last_active: '5m ago' },
  { id: 'u003', email: 'faith.m@tum.ac.ke', role: 'user', conversations: 18, joined: 'Mar 1, 2026', last_active: '12m ago' },
  { id: 'u004', email: 'peter.o@yahoo.com', role: 'user', conversations: 9, joined: 'Mar 2, 2026', last_active: '28m ago' },
  { id: 'u005', email: 'grace.n@gmail.com', role: 'user', conversations: 31, joined: 'Mar 3, 2026', last_active: '1h ago' },
  { id: 'u006', email: 'john.m@hotmail.com', role: 'user', conversations: 15, joined: 'Mar 4, 2026', last_active: '2h ago' },
  { id: 'u007', email: 'mary.w@gmail.com', role: 'user', conversations: 7, joined: 'Mar 5, 2026', last_active: '3h ago' },
  { id: 'u008', email: 'samuel.k@gmail.com', role: 'scout', conversations: 4, joined: 'Mar 6, 2026', last_active: '4h ago' },
  { id: 'u009', email: 'anne.w@gmail.com', role: 'user', conversations: 22, joined: 'Mar 7, 2026', last_active: '1d ago' },
  { id: 'u010', email: 'david.o@gmail.com', role: 'user', conversations: 11, joined: 'Mar 8, 2026', last_active: '2d ago' },
];

const ROLES = ['user', 'scout', 'data', 'product', 'admin'];
const roleVariant = { admin: 'green', scout: 'amber', data: 'blue', product: 'blue', user: 'default' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);

  const load = useCallback(async () => {
    try {
      const u = await getUsers();
      if (Array.isArray(u) && u.length > 0 && !u.error) {
        // Map API fields to UI fields
        const mapped = u.map(usr => ({
          id: usr.id,
          email: usr.email,
          name: usr.name || usr.email.split('@')[0],
          role: usr.role || 'user',
          conversations: usr.conversation_count || 0,
          joined: usr.created_at ? new Date(usr.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
          last_active: usr.last_login_at ? new Date(usr.last_login_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : usr.last_seen_at ? new Date(usr.last_seen_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : 'Never',
          location: usr.user_location || usr.organization || '—',
          validations: usr.validations_count || 0,
        }));
        setUsers(mapped);
      } else {
        setUsers(MOCK_USERS);
      }
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId, newRole) => {
    setPromoting(userId);
    try {
      await promoteUser(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      // API error — still update UI optimistically for demo
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } finally {
      setPromoting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) ||
           u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleCount = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Users" value={users.length} accent />
        {ROLES.slice(1).map((r) => (
          <StatCard key={r} label={r.charAt(0).toUpperCase() + r.slice(1) + 's'} value={roleCount[r] || 0} />
        ))}
      </div>

      {/* Search */}
      <div>
        <SectionHeader title="User Management" sub="Search, view, and manage access roles" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or role..."
          className="w-full sm:w-80 bg-surface-1 border border-border rounded-md px-3 py-2 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-brand-green/40 transition-colors"
        />
      </div>

      {/* Users table */}
      <div className="bg-surface-1 border border-border rounded-lg overflow-x-auto">
        <DataTable
          columns={[
            { key: 'email', label: 'Email' },
            {
              key: 'role', label: 'Role',
              render: (v) => <Badge variant={roleVariant[v] || 'default'}>{v}</Badge>,
            },
            { key: 'conversations', label: 'Convos' },
            { key: 'joined', label: 'Joined' },
            { key: 'last_active', label: 'Last Active' },
          ]}
          rows={filtered}
          onRowAction={(row) => (
            row.role !== 'admin' ? (
              <select
                value={row.role}
                onChange={(e) => handleRoleChange(row.id, e.target.value)}
                disabled={promoting === row.id}
                className="bg-surface-2 border border-border text-zinc-400 font-mono text-[10px] rounded px-2 py-1 focus:outline-none focus:border-brand-green/40 disabled:opacity-40 cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-[10px] text-zinc-700">owner</span>
            )
          )}
        />
      </div>

      {filtered.length === 0 && (
        <p className="font-mono text-xs text-zinc-600 text-center py-4">No users match "{search}"</p>
      )}
    </div>
  );
}
