'use client';

import { useEffect, useState, useCallback } from 'react';
import { getErrors } from '../../../lib/api';
import { Spinner, ErrState, Stat, Section, Card, Dot, Pill, Btn, fmt } from '../../../components/shared';

const ERROR_COLOR = {
  critical: 'red',
  error:    'red',
  warning:  'amber',
  info:     'default',
  security: 'amber',
};

export default function MonitoringPage() {
  const [errors,   setErrors]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getErrors(100);
      const list = Array.isArray(data?.errors) ? data.errors : Array.isArray(data) ? data : [];
      setErrors(list);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    if (!autoRefresh) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, autoRefresh]);

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const filtered = filter === 'all' ? errors : errors.filter(e =>
    (e.level || e.error_type || '').toLowerCase() === filter
  );

  const counts = {
    total:    errors.length,
    critical: errors.filter(e => ['critical', 'error'].includes((e.level || e.error_type || '').toLowerCase())).length,
    security: errors.filter(e => (e.error_type || e.type || '').toLowerCase().includes('security') || (e.error_type || '').toLowerCase().includes('rate_limit') || (e.error_type || '').toLowerCase().includes('injection')).length,
    warning:  errors.filter(e => (e.level || '').toLowerCase() === 'warning').length,
  };

  // Aggregate by type
  const byType = errors.reduce((acc, e) => {
    const type = e.error_type || e.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Aggregate by endpoint
  const byEndpoint = errors.reduce((acc, e) => {
    const ep = e.endpoint || e.path || 'unknown';
    acc[ep] = (acc[ep] || 0) + 1;
    return acc;
  }, {});
  const topEndpoints = Object.entries(byEndpoint).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const FILTERS = ['all', 'error', 'warning', 'security'];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Events"    value={fmt(counts.total)} />
        <Stat label="Errors"          value={fmt(counts.critical)} sub={counts.critical > 10 ? 'High — investigate' : 'Normal'} accent={counts.critical > 10} />
        <Stat label="Security Events" value={fmt(counts.security)} sub={counts.security > 0 ? 'Rate limits + injection' : 'None'} />
        <Stat label="Warnings"        value={fmt(counts.warning)} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded border transition-colors ${filter === f ? 'border-brand-green/40 text-brand-green bg-brand-green/5' : 'border-border text-zinc-600 hover:text-zinc-400'}`}>
              {f} {f !== 'all' && `(${f === 'security' ? counts.security : f === 'error' ? counts.critical : counts.warning})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
              className="accent-brand-green" />
            <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Auto-refresh</span>
          </label>
          <Btn onClick={load}>↻ Refresh</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Top error types */}
        <Section title="Top Error Types">
          {topTypes.length === 0 ? (
            <Card className="p-6 text-center">
              <span className="font-mono text-[10px] text-brand-green">✓ No errors</span>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {topTypes.map(([type, count]) => (
                <div key={type} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 font-mono text-[10px] text-zinc-300 truncate">{type}</span>
                  <span className="font-mono text-[10px] text-zinc-400 tabular-nums">{count}</span>
                  <div className="w-20 h-1 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/40 rounded-full"
                      style={{ width: `${Math.round((count / (topTypes[0]?.[1] || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </Section>

        {/* Top endpoints with errors */}
        <Section title="Top Affected Endpoints">
          {topEndpoints.length === 0 ? (
            <Card className="p-6 text-center">
              <span className="font-mono text-[10px] text-brand-green">✓ No endpoint errors</span>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {topEndpoints.map(([endpoint, count]) => (
                <div key={endpoint} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 font-mono text-[9px] text-zinc-400 truncate">{endpoint}</span>
                  <span className="font-mono text-[10px] text-zinc-400 tabular-nums">{count}</span>
                </div>
              ))}
            </Card>
          )}
        </Section>
      </div>

      {/* Full error log */}
      <Section title={`Error Log (${filtered.length})`} sub="Last 100 events · newest first">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="font-mono text-[10px] text-brand-green">✓ No events matching filter</span>
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {filtered.map((ev, i) => {
              const level    = (ev.level || ev.error_type || 'info').toLowerCase();
              const isSec    = level.includes('security') || level.includes('rate') || level.includes('injection');
              const pillColor = isSec ? 'amber' : level.includes('error') || level.includes('critical') ? 'red' : 'default';
              return (
                <div key={i} className="px-4 py-2.5 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <Dot status={pillColor === 'red' ? 'error' : pillColor === 'amber' ? 'warning' : 'unknown'} />
                    <span className="font-mono text-[10px] text-zinc-300 flex-1 truncate">
                      {ev.message || ev.error_message || ev.error || '—'}
                    </span>
                    <Pill color={pillColor}>{ev.error_type || ev.level || 'info'}</Pill>
                    <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">
                      {ev.created_at ? new Date(ev.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : ev.time || '—'}
                    </span>
                  </div>
                  {(ev.endpoint || ev.path || ev.user_id) && (
                    <div className="flex gap-4 mt-1 ml-5">
                      {ev.endpoint && <span className="font-mono text-[9px] text-zinc-700">{ev.endpoint}</span>}
                      {ev.path && <span className="font-mono text-[9px] text-zinc-700">{ev.path}</span>}
                      {ev.user_id && <span className="font-mono text-[9px] text-zinc-700">user: {ev.user_id}</span>}
                      {ev.ip && <span className="font-mono text-[9px] text-zinc-700">ip: {ev.ip}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </Section>
    </div>
  );
}
