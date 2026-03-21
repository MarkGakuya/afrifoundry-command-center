'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPipelineStats, getScraperStats, getDatapoints, labelConversation } from '../../../lib/api';
import { Spinner, ErrState, Section, Card, Dot, Btn, Pill, fmt, pct } from '../../../components/shared';

export default function IntelligencePage() {
  const [pipeline,  setPipeline]  = useState(null);
  const [scrapers,  setScrapers]  = useState([]);
  const [queue,     setQueue]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, s, q] = await Promise.all([
        getPipelineStats(),
        getScraperStats(),
        getDatapoints(20),
      ]);
      setPipeline(p);
      setScrapers(Array.isArray(s?.scrapers) ? s.scrapers : Array.isArray(s) ? s : []);
      setQueue(Array.isArray(q?.datapoints) ? q.datapoints : Array.isArray(q) ? q : []);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = async (id, label) => {
    try { await labelConversation(id, label); }
    catch {}
    setQueue(q => q.filter(d => d.id !== id));
  };

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const stages = [
    { label: 'Scraped',      key: 'scraped_count' },
    { label: 'Cleaned',      key: 'cleaned_count' },
    { label: 'Validated',    key: 'validated_count' },
    { label: 'Stored',       key: 'stored_count' },
  ];
  const base = pipeline?.[stages[0].key] || 1;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Pipeline */}
      <Section title="Cleaning Pipeline" sub="Raw → Stored flow">
        <Card className="p-4 space-y-2.5">
          {stages.map((stage, i) => {
            const val = pipeline?.[stage.key] ?? 0;
            const w   = Math.min(100, Math.round((val / base) * 100));
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 w-20 flex-shrink-0">{stage.label}</span>
                <div className="flex-1 h-5 bg-surface-3 rounded relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-brand-green/15 rounded" style={{ width: `${w}%` }} />
                  <span className="absolute left-3 top-0 h-full flex items-center font-mono text-[10px] text-brand-green">
                    {fmt(val)}
                  </span>
                </div>
                {i < stages.length - 1 && <span className="font-mono text-[9px] text-zinc-700">↓</span>}
              </div>
            );
          })}
          {pipeline?.review_queue_count > 0 && (
            <div className="pt-2 border-t border-border flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 w-20">Queue</span>
              <span className="font-mono text-[10px] text-amber-400">{fmt(pipeline.review_queue_count)} datapoints pending review</span>
            </div>
          )}
        </Card>
      </Section>

      {/* Scraper grid */}
      {scrapers.length > 0 && (
        <Section title={`Scrapers (${scrapers.length})`} sub="All active data scrapers">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {scrapers.map((s) => (
              <Card key={s.scraper_id || s.id} className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="font-mono text-[9px] text-zinc-600">{s.scraper_id || s.id}</span>
                  <Dot status={s.status || 'unknown'} />
                </div>
                <p className="font-mono text-[10px] text-zinc-300 leading-tight line-clamp-2">{s.name}</p>
                <p className="font-mono text-[9px] text-zinc-600 mt-1.5">{fmt(s.datapoints || s.datapoint_count)} pts</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Review queue */}
      <Section title={`Review Queue (${queue.length})`} sub="Low-confidence datapoints — approve or reject">
        {queue.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="font-mono text-[10px] text-brand-green">✓ Queue is clear</span>
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {queue.map((dp) => (
              <div key={dp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-zinc-300">{dp.item}</p>
                  <p className="font-mono text-[9px] text-zinc-600">
                    {dp.value ? `KES ${dp.value}` : '—'} · {dp.geography_county || dp.county || '—'} · {dp.scraper_id || dp.source || '—'}
                  </p>
                </div>
                <span className={`font-mono text-[10px] flex-shrink-0 ${(dp.confidence_score || dp.confidence || 0) < 0.6 ? 'text-red-400' : 'text-amber-400'}`}>
                  {pct((dp.confidence_score || dp.confidence || 0) * 100)}
                </span>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Btn small variant="green" onClick={() => handle(dp.id, 'approved')}>✓</Btn>
                  <Btn small variant="red"   onClick={() => handle(dp.id, 'rejected')}>✗</Btn>
                </div>
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  );
}
