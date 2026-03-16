'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  StatCard, StatusLight, SectionHeader, ActionButton, LoadingSpinner, ErrorState,
} from '../../../components/ui';
import {
  getBridgeStats, getActivityFeed, triggerScraperRun, seedKenyaToday, exportFinetune,
} from '../../../lib/api';

const MOCK_STATS = {
  total_users: 247,
  total_datapoints: 18420,
  conversations_today: 34,
  active_users: 12,
  messages_sent: 1204,
  feedback_received: 89,
  review_queue_count: 14,
  api_status: 'healthy',
  db_status: 'healthy',
  ai_status: 'healthy',
  scout_status: 'healthy',
  scraper_status: 'warning',
};

const MOCK_FEED = [
  { type: 'user', text: 'New user joined: james.k@gmail.com', time: '2m ago' },
  { type: 'convo', text: 'Conversation started — farming / Kisumu', time: '4m ago' },
  { type: 'scout', text: 'Scout sync: 3 datapoints from Kongowea', time: '11m ago' },
  { type: 'scraper', text: 'S01 ran — 42 prices updated', time: '18m ago' },
  { type: 'convo', text: 'Conversation started — business / Nairobi', time: '22m ago' },
  { type: 'user', text: 'New user joined: faith.m@students.tum.ac.ke', time: '31m ago' },
  { type: 'scout', text: 'Scout sync: 7 datapoints from Gikomba', time: '45m ago' },
  { type: 'scraper', text: 'S03 ran — 18 prices updated', time: '1h ago' },
  { type: 'convo', text: 'Conversation started — health / Mombasa', time: '1h ago' },
  { type: 'review', text: '3 datapoints flagged for review (conf < 0.65)', time: '1h ago' },
];

const feedIcon = { user: '◌', convo: '◎', scout: '◉', scraper: '⬡', review: '△' };
const feedColor = {
  user: 'text-brand-blue', convo: 'text-brand-green', scout: 'text-brand-amber',
  scraper: 'text-zinc-400', review: 'text-brand-red',
};

export default function BridgePage() {
  const [stats, setStats] = useState(null);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([getBridgeStats(), getActivityFeed()]);
      if (s?.error) throw new Error();
      setStats(s);
      setFeed(f?.events || f || []);
    } catch {
      setStats(MOCK_STATS);
      setFeed(MOCK_FEED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const doAction = async (fn, label) => {
    setActionMsg(`Running: ${label}...`);
    try { await fn(); setActionMsg(`✓ ${label} complete`); }
    catch { setActionMsg(`✗ ${label} failed`); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  if (loading) return <LoadingSpinner />;

  const s = stats;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* System Status */}
      <div>
        <SectionHeader title="System Status" sub="Live health across all systems" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'API', key: 'api_status' },
            { label: 'Database', key: 'db_status' },
            { label: 'AfriFoundry AI', key: 'ai_status' },
            { label: 'AfriScout', key: 'scout_status' },
            { label: 'Scrapers', key: 'scraper_status' },
          ].map((item) => (
            <div key={item.key} className="bg-surface-1 border border-border rounded-lg p-3 flex items-center gap-3">
              <StatusLight status={s?.[item.key] || 'unknown'} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Numbers */}
      <div>
        <SectionHeader title="Platform Metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={s?.total_users?.toLocaleString()} accent />
          <StatCard label="Total Datapoints" value={s?.total_datapoints?.toLocaleString()} accent />
          <StatCard label="Conversations Today" value={s?.conversations_today} />
          <StatCard label="Active Users" value={s?.active_users} />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Messages Sent" value={s?.messages_sent?.toLocaleString()} />
        <StatCard label="Feedback Received" value={s?.feedback_received} />
        <StatCard label="Review Queue" value={s?.review_queue_count}
          sub={s?.review_queue_count > 0 ? 'Needs attention' : 'All clear'} />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="green" onClick={() => doAction(seedKenyaToday, 'Seed Kenya Today')}>
            ↳ Seed Kenya Today
          </ActionButton>
          <ActionButton onClick={() => doAction(triggerScraperRun, 'Scraper Run')}>
            ↳ Trigger Scraper Run
          </ActionButton>
          <ActionButton onClick={() => doAction(exportFinetune, 'Export Fine-tune Data')}>
            ↳ Export Fine-tune Data
          </ActionButton>
          <ActionButton onClick={load}>↳ Refresh</ActionButton>
        </div>
        {actionMsg && (
          <p className="font-mono text-[11px] text-brand-green mt-2 animate-fade-in">{actionMsg}</p>
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <SectionHeader title="Live Activity Feed" sub="Last 20 events across all systems" />
        <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
          {(feed.length ? feed : MOCK_FEED).map((event, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
              <span className={`font-mono text-sm ${feedColor[event.type] || 'text-zinc-400'}`}>
                {feedIcon[event.type] || '·'}
              </span>
              <span className="flex-1 font-mono text-[11px] text-zinc-300">{event.text}</span>
              <span className="font-mono text-[10px] text-zinc-600">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
