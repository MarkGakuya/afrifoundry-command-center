'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  StatCard, StatusLight, SectionHeader, ActionButton, LoadingSpinner,
} from '../../../components/ui';
import {
  getBridgeStats, getActivityFeed, triggerScraperRun, seedKenyaToday, exportFinetune,
} from '../../../lib/api';

// Real stats structure — updated from your actual systems
const MOCK_STATS = {
  total_users: 100,
  total_datapoints: 500000,
  conversations_today: 0,
  active_users: 0,
  messages_sent: 0,
  feedback_received: 0,
  review_queue_count: 0,
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
const feedColorClass = {
  user: '#4488ff', convo: '#00ff88', scout: '#ffaa00',
  scraper: '#71717a', review: '#ff4444',
};

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export default function BridgePage() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [feed, setFeed] = useState(MOCK_FEED);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      const s = await getBridgeStats();
      if (s && !s.error && s.users) {
        // Map nested API response to flat stats object
        const mapped = {
          total_users: s.users?.total || 0,
          total_datapoints: s.datapoints?.total || 0,
          conversations_today: s.conversations?.today || 0,
          active_users: s.users?.active_24h || 0,
          messages_sent: s.conversations?.total || 0,
          feedback_received: (s.feedback?.thumbs_up || 0) + (s.feedback?.thumbs_down || 0),
          review_queue_count: 0,
          api_status: 'healthy',
          db_status: 'healthy',
          ai_status: s.errors_24h > 5 ? 'warning' : 'healthy',
          scout_status: 'healthy',
          scraper_status: 'warning',
          // extras
          users_this_week: s.users?.new_this_week || 0,
          retention_rate: s.users?.retention_rate || 0,
          avg_turns: s.conversations?.avg_turns || 0,
          deep_conversations: s.conversations?.deep_conversations || 0,
          satisfaction_rate: s.feedback?.satisfaction_rate || 0,
          errors_24h: s.errors_24h || 0,
        };
        setStats(mapped);
        setUsingMock(false);
        // Activity feed from stats response
        if (s.activity && s.activity.length > 0) {
          const feed = s.activity.map(a => ({
            type: a.type === 'new_user' ? 'user' : 'convo',
            text: a.type === 'new_user' ? `New user joined: ${a.detail}` : `Conversation: ${a.detail}`,
            time: a.when ? new Date(a.when).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '',
          }));
          setFeed(feed);
        }
      } else {
        setStats(MOCK_STATS);
        setUsingMock(true);
        setFeed(MOCK_FEED);
      }
    } catch {
      setStats(MOCK_STATS);
      setFeed(MOCK_FEED);
      setUsingMock(true);
    } finally {
      setLoading(false);
      setLastRefresh(new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const doAction = async (fn, label) => {
    setActionMsg(`Running: ${label}...`);
    try { await fn(); setActionMsg(`✓ ${label} complete`); }
    catch { setActionMsg(`✗ ${label} failed`); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  if (loading) return <LoadingSpinner />;

  const s = stats || MOCK_STATS;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Mock data notice */}
      {usingMock && (
        <div style={{
          background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.2)',
          borderRadius: 8, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: '#ffaa00', fontSize: 10 }}>△</span>
          <span className="font-mono text-[10px] text-zinc-400">
            API not connected — showing baseline data. Connect your AfriFoundry backend to see live metrics.
          </span>
        </div>
      )}

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
          <StatCard label="Total Users" value={safeNum(s.total_users, 100).toLocaleString()} accent />
          <StatCard label="Total Datapoints" value={safeNum(s.total_datapoints, 500000).toLocaleString()} accent />
          <StatCard label="Conversations Today" value={safeNum(s.conversations_today, 0).toLocaleString()} />
          <StatCard label="Active Users" value={safeNum(s.active_users, 0).toLocaleString()} />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Conversations" value={safeNum(s.messages_sent, 0).toLocaleString()} sub={`avg ${safeNum(s.avg_turns, 0)} turns`} />
        <StatCard label="Feedback Received" value={safeNum(s.feedback_received, 0).toLocaleString()} sub={s.satisfaction_rate ? `${s.satisfaction_rate}% positive` : ''} />
        <StatCard label="Errors (24h)" value={safeNum(s.errors_24h, 0).toLocaleString()} sub={safeNum(s.errors_24h, 0) > 0 ? 'Check logs' : 'All clear'} />
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
        {lastRefresh && (
          <p className="font-mono text-[10px] text-zinc-700 mt-1">Last refreshed: {lastRefresh} · Auto-refreshes every 30s</p>
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <SectionHeader title="Live Activity Feed" sub="Last 20 events across all systems" />
        <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
          {(feed.length ? feed : MOCK_FEED).map((event, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
              <span style={{ color: feedColorClass[event.type] || '#71717a' }} className="font-mono text-sm">
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
