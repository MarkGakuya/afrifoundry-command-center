'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUsers, promoteUser } from '../../../lib/api';
import { Spinner, ErrState, Stat, Section, Card, Pill, Btn, fmt } from '../../../components/shared';

const ROLES = ['user', 'scout', 'data', 'product', 'admin'];
const ROLE_COLOR = { admin: 'green', scout: 'amber', data: 'blue', product: 'blue', user: 'default' };

export default function UsersPage() {
  const [users,    setUsers]    = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);
  const [promoting, setPromoting] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getUsers(200);
      const list = Array.isArray(data) ? data : data?.users || [];
      setUsers(list.map(u => ({
        id:           u.id,
        email:        u.email,
        role:         u.role || 'user',
        conversations: u.conversation_count || 0,
        joined:       u.created_at ? new Date(u.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
        last_active:  u.last_login_at
          ? new Date(u.last_login_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
          : u.last_seen_at
            ? new Date(u.last_seen_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
            : 'Never',
      })));
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id, role) => {
    setPromoting(id);
    try { await promoteUser(id, role); }
    catch {}
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setPromoting(null);
  };

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );
  const roleCounts = ROLES.reduce((a, r) => ({ ...a, [r]: users.filter(u => u.role === r).length }), {});

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label="Total" value={fmt(users.length)} accent />
        {ROLES.map(r => (
          <Stat key={r} label={r.charAt(0).toUpperCase() + r.slice(1) + 's'} value={roleCounts[r] || 0} />
        ))}
      </div>

      <Section title="User Management" sub="Search, view, manage roles">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by email or role..."
          className="w-full sm:w-72 bg-surface-1 border border-border rounded px-3 py-2 font-mono text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-brand-green/40 transition-colors" />
      </Section>

      <Card className="overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-border">
              {['Email', 'Role', 'Convos', 'Joined', 'Last Active', ''].map(h => (
                <th key={h} className="text-left text-[9px] uppercase tracking-widest text-zinc-600 pb-2 pr-4 pt-3 px-4 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                <td className="py-2 pr-4 px-4 text-zinc-300 max-w-[180px] truncate">{u.email}</td>
                <td className="py-2 pr-4"><Pill color={ROLE_COLOR[u.role] || 'default'}>{u.role}</Pill></td>
                <td className="py-2 pr-4 text-zinc-500">{u.conversations}</td>
                <td className="py-2 pr-4 text-zinc-600">{u.joined}</td>
                <td className="py-2 pr-4 text-zinc-600">{u.last_active}</td>
                <td className="py-2 pr-4 text-right">
                  {u.role !== 'admin' ? (
                    <select value={u.role} disabled={promoting === u.id}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="bg-surface-2 border border-border text-zinc-400 font-mono text-[9px] rounded px-2 py-0.5 focus:outline-none disabled:opacity-40 cursor-pointer">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className="text-[9px] text-zinc-700">owner</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="font-mono text-[10px] text-zinc-700 text-center py-6">No users match "{search}"</p>
        )}
      </Card>
    </div>
  );
}
