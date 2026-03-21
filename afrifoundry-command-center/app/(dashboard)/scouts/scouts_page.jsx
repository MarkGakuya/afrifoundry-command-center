'use client';

import { useEffect, useState, useCallback } from 'react';
import { getScouts, getScoutFeed } from '../../../lib/api';
import { Spinner, Stat, Section, Card, Dot, Pill, fmt } from '../../../components/shared';

export default function ScoutsPage() {
  const [scouts,  setScouts]  = useState([]);
  const [feed,    setFeed]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([getScouts(), getScoutFeed()]);
    setScouts(Array.isArray(s) ? s : []);
    setFeed(Array.isArray(f) ? f : f?.datapoints || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  const active   = scouts.filter(s => s.status === 'active').length;
  const weekly   = scouts.reduce((sum, s) => sum + (s.collections_week || s.collections_this_week || 0), 0);
  const avgQual  = scouts.length
    ? Math.round(scouts.reduce((sum, s) => sum + (s.quality_score || 0), 0) / scouts.length)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total Scouts"      value={fmt(scouts.length)} accent />
        <Stat label="Active Scouts"     value={fmt(active)} />
        <Stat label="Collections/Week"  value={fmt(weekly)} />
        <Stat label="Avg Quality"       value={avgQual ? `${avgQual}%` : '—'} />
      </div>

      {scouts.length > 0 ? (
        <Section title="Scout Network" sub="Field collectors">
          <Card className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Scout', 'County', 'This Week', 'Quality', 'Status', 'Last Sync'].map(h => (
                    <th key={h} className="text-left text-[9px] uppercase tracking-widest text-zinc-600 pb-2 pr-4 pt-3 px-4 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scouts.map((s, i) => (
                  <tr key={s.id || i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                    <td className="py-2 pr-4 px-4 text-zinc-300">{s.name || s.scout_name || '—'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{s.county || s.location || '—'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{fmt(s.collections_week || s.collections_this_week)}</td>
                    <td className="py-2 pr-4">
                      <span className={`${(s.quality_score || 0) >= 90 ? 'text-brand-green' : (s.quality_score || 0) >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                        {s.quality_score ? `${s.quality_score}%` : '—'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <Pill color={s.status === 'active' ? 'green' : 'default'}>{s.status || 'unknown'}</Pill>
                    </td>
                    <td className="py-2 pr-4 text-zinc-600">{s.last_sync || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      ) : (
        <Section title="Scout Network">
          <Card className="p-12 text-center">
            <p className="font-mono text-[10px] text-zinc-700">No scouts connected yet</p>
            <p className="font-mono text-[9px] text-zinc-800 mt-1">AfriScout field data will appear here when scouts sync</p>
          </Card>
        </Section>
      )}

      <Section title="Scout Sync Feed" sub="Latest field datapoints">
        {feed.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="font-mono text-[10px] text-zinc-700">No recent field syncs</span>
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {feed.slice(0, 20).map((ev, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
                <span className="font-mono text-amber-400 text-sm flex-shrink-0">◉</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-zinc-300">
                    <span className="text-zinc-600">{ev.scout || ev.scout_name || '—'}</span>
                    {' → '}
                    {ev.item}
                    {' · '}
                    <span className="text-brand-green">{ev.value}</span>
                  </p>
                  <p className="font-mono text-[9px] text-zinc-700">{ev.market || '—'}, {ev.county || '—'}</p>
                </div>
                <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">{ev.time || ev.synced_at || '—'}</span>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  );
}
