'use client';

import { useEffect, useState, useCallback } from 'react';
import { getBridgeStats, triggerScraper, seedKenyaToday, exportFinetune } from '../../../lib/api';
import { Spinner, ErrState, Stat, Section, Card, Dot, Btn, Pill, fmt } from '../../../components/shared';

const FEED_ICON  = { user: '◌', convo: '◎', scout: '◉', scraper: '⬡', review: '△', error: '✕' };
const FEED_COLOR = { user: 'text-blue-400', convo: 'text-brand-green', scout: 'text-amber-400', scraper: 'text-zinc-500', review: 'text-amber-400', error: 'text-red-400' };

export default function BridgePage() {
  const [stats,   setStats]   = useState(null);
  const [feed,    setFeed]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);
  const [msg,     setMsg]     = useState('');

  const load = useCallback(async () => {
    try {
      const s = await getBridgeStats();
      setStats(s);
      setFeed(s.activity || s.recent_activity || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const act = async (fn, label) => {
    setMsg(`Running ${label}...`);
    try { await fn(); setMsg(`✓ ${label} done`); }
    catch (e) { setMsg(`✗ ${label}: ${e.message}`); }
    setTimeout(() => setMsg(''), 4000);
  };

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const sys = [
    { label: 'API',       key: 'api_status' },
    { label: 'Database',  key: 'db_status' },
    { label: 'AI Engine', key: 'ai_status' },
    { label: 'AfriScout', key: 'scout_status' },
    { label: 'Scrapers',  key: 'scraper_status' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* System status */}
      <div className="grid grid-cols-5 gap-2">
        {sys.map(({ label, key }) => (
          <Card key={key} className="px-3 py-2.5 flex items-center gap-2">
            <Dot status={stats?.[key] || 'unknown'} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 truncate">{label}</span>
          </Card>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Users"     value={fmt(stats?.total_users)}          accent />
        <Stat label="Datapoints"      value={fmt(stats?.total_datapoints)}     accent />
        <Stat label="Convos Today"    value={fmt(stats?.conversations_today)} />
        <Stat label="Active (24h)"    value={fmt(stats?.active_users)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Messages Sent"     value={fmt(stats?.messages_sent)} />
        <Stat label="Feedback Received" value={fmt(stats?.feedback_received)} />
        <Stat label="Review Queue"
          value={fmt(stats?.review_queue_count)}
          sub={stats?.review_queue_count > 0 ? 'Needs attention' : 'All clear'} />
      </div>

      {/* Actions */}
      <Section title="Quick Actions">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Seed Kenya Today',    fn: seedKenyaToday },
            { label: 'Trigger Scraper Run', fn: triggerScraper },
            { label: 'Export Fine-tune',    fn: exportFinetune },
            { label: 'Refresh',             fn: load },
          ].map(({ label, fn }) => (
            <Btn key={label} onClick={() => act(fn, label)}>↳ {label}</Btn>
          ))}
        </div>
        {msg && <p className="font-mono text-[10px] text-brand-green mt-2">{msg}</p>}
      </Section>

      {/* Activity feed */}
      <Section title="Live Activity" sub="Last 20 events">
        {feed.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="font-mono text-[10px] text-zinc-700">No recent activity</span>
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {feed.slice(0, 20).map((ev, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
                <span className={`font-mono text-sm flex-shrink-0 ${FEED_COLOR[ev.type] || 'text-zinc-500'}`}>
                  {FEED_ICON[ev.type] || '·'}
                </span>
                <span className="flex-1 font-mono text-[10px] text-zinc-400">{ev.text || ev.message}</span>
                <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">{ev.time || ev.timestamp}</span>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  );
}
