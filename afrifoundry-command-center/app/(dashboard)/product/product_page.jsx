'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProductStats, getConversations, getFeedback } from '../../../lib/api';
import { Spinner, ErrState, Stat, Section, Card, Pill, fmt, pct } from '../../../components/shared';

const TYPE_COLOR = { Business: 'green', Farming: 'amber', Health: 'blue', Transport: 'amber', Student: 'blue', Career: 'green', Housing: 'default', General: 'default' };

export default function ProductPage() {
  const [stats,  setStats]  = useState(null);
  const [convos, setConvos] = useState([]);
  const [fb,     setFb]     = useState(null);
  const [loading, setL]     = useState(true);
  const [err,    setErr]     = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, c, f] = await Promise.all([getProductStats(), getConversations(30), getFeedback(50)]);
      setStats(s);
      setConvos(Array.isArray(c?.conversations) ? c.conversations : Array.isArray(c) ? c : []);
      setFb(f);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setL(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const thumbsUp   = stats?.thumbs_up   ?? fb?.thumbs_up   ?? 0;
  const thumbsDown = stats?.thumbs_down ?? fb?.thumbs_down ?? 0;
  const total      = thumbsUp + thumbsDown || 1;
  const quality    = Math.round((thumbsUp / total) * 100);

  const types  = stats?.conversation_types || [];
  const typeTotal = types.reduce((s, t) => s + (t.count || 0), 0) || 1;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Conversations" value={fmt(stats?.total_conversations)} accent />
        <Stat label="Total Messages"      value={fmt(stats?.total_messages)}      accent />
        <Stat label="Active Users (7d)"   value={fmt(stats?.active_users_7d)} />
        <Stat label="Quality Rate"        value={`${quality}%`} sub="Thumbs up ratio" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Conversation types */}
        {types.length > 0 && (
          <Section title="Conversation Types" sub="What Africans are asking about">
            <Card className="p-4 space-y-2.5">
              {types.map((t) => {
                const w = Math.round((t.count / typeTotal) * 100);
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 w-20 flex-shrink-0">{t.type}</span>
                    <div className="flex-1 h-4 bg-surface-3 rounded overflow-hidden">
                      <div className="h-full bg-brand-green/20 rounded" style={{ width: `${w}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-zinc-600 w-8 text-right">{w}%</span>
                  </div>
                );
              })}
            </Card>
          </Section>
        )}

        {/* Feedback */}
        <div className="space-y-4">
          <Section title="Feedback">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Thumbs Up"   value={fmt(thumbsUp)} />
              <Stat label="Thumbs Down" value={fmt(thumbsDown)} />
              <Stat label="Quality"     value={`${quality}%`} accent />
            </div>
          </Section>

          <Section title="Streaming Health">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Avg Response"  value={stats?.avg_response_ms ? `${stats.avg_response_ms}ms` : '—'} />
              <Stat label="Timeout Rate"  value={stats?.timeout_rate != null ? `${stats.timeout_rate}%` : '—'}
                sub={stats?.timeout_rate < 2 ? 'Healthy' : stats?.timeout_rate ? 'Monitor' : ''} />
            </div>
          </Section>
        </div>
      </div>

      {/* Conversations */}
      {convos.length > 0 && (
        <Section title="Recent Conversations" sub={`Last ${convos.length}`}>
          <Card className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'Type', 'Preview', 'Msgs', 'Time'].map(h => (
                    <th key={h} className="text-left text-[9px] uppercase tracking-widest text-zinc-600 pb-2 pr-4 pt-3 px-4 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {convos.map((c, i) => (
                  <tr key={c.id || i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                    <td className="py-2 pr-4 px-4 text-zinc-400 max-w-[140px] truncate">{c.user_email || c.user || '—'}</td>
                    <td className="py-2 pr-4">
                      <Pill color={TYPE_COLOR[c.conversation_type || c.type] || 'default'}>
                        {c.conversation_type || c.type || 'general'}
                      </Pill>
                    </td>
                    <td className="py-2 pr-4 text-zinc-500 max-w-[200px] truncate">{c.first_message || c.preview || '—'}</td>
                    <td className="py-2 pr-4 text-zinc-600">{c.turn_count || c.messages || '—'}</td>
                    <td className="py-2 pr-4 text-zinc-700">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : c.time || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}
    </div>
  );
}
