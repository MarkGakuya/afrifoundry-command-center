'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPipelineStatus, runPipeline, getPipelineHistory, getInfraOverview } from '../../../lib/api';
import { Spinner, ErrState, Stat, Section, Card, Dot, Pill, Btn, fmt } from '../../../components/shared';

export default function InfrastructurePage() {
  const [status,  setStatus]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);
  const [running, setRunning] = useState(false);
  const [msg,     setMsg]     = useState('');

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([getPipelineStatus(), getPipelineHistory()]);
      setStatus(s);
      setHistory(Array.isArray(h?.runs) ? h.runs : Array.isArray(h) ? h : []);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const triggerRun = async () => {
    setRunning(true);
    setMsg('Pipeline triggered...');
    try {
      await runPipeline();
      setMsg('✓ Pipeline run queued');
      setTimeout(load, 3000);
    } catch (e) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setRunning(false);
      setTimeout(() => setMsg(''), 5000);
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const isRunning = status?.is_running || status?.status === 'running';
  const scheduled = status?.schedule_enabled ?? status?.scheduled ?? false;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`bg-surface-1 border rounded-lg p-4 flex flex-col gap-1 ${isRunning ? 'border-brand-green/30' : 'border-border'}`}>
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Pipeline</span>
          <div className="flex items-center gap-2 mt-1">
            <Dot status={isRunning ? 'healthy' : 'unknown'} />
            <span className={`font-syne font-bold text-sm ${isRunning ? 'text-brand-green' : 'text-zinc-400'}`}>
              {isRunning ? 'Running' : 'Idle'}
            </span>
          </div>
        </div>
        <Stat label="Schedule"   value={scheduled ? 'Active' : 'Paused'} sub="Sunday 2:00am EAT" />
        <Stat label="Last Run"   value={status?.last_run_at ? new Date(status.last_run_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : 'Never'} />
        <Stat label="Next Run"   value={status?.next_run_at ? new Date(status.next_run_at).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'} />
      </div>

      {/* Last run stats */}
      {status?.last_run && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Pulled',   value: status.last_run.pulled },
            { label: 'Inserted', value: status.last_run.inserted },
            { label: 'Updated',  value: status.last_run.updated },
            { label: 'Skipped',  value: status.last_run.skipped },
            { label: 'Rejected', value: status.last_run.rejected },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-1 border border-border rounded-lg px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{label}</div>
              <div className="font-mono text-xs text-zinc-300 mt-1">{fmt(value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <Section title="Controls">
        <div className="flex items-center gap-3 flex-wrap">
          <Btn variant="green" disabled={running || isRunning} onClick={triggerRun}>
            {isRunning ? '⟳ Running...' : '▶ Run Pipeline Now'}
          </Btn>
          <Btn onClick={load}>↻ Refresh</Btn>
        </div>
        {msg && <p className="font-mono text-[10px] text-brand-green mt-2">{msg}</p>}
      </Section>

      {/* DB routing */}
      <Section title="Database Routing" sub="How data flows through the 10-DB architecture">
        <Card className="p-4">
          <div className="font-mono text-[10px] text-zinc-500 space-y-2.5">
            {[
              { from: 'Scrapers (50)',      to: 'afrifoundry-raw',   note: 'Staging dump — wiped after each run' },
              { from: 'Cleaning Pipeline', to: 'MAIN + Pool DBs',   note: 'Cleaned datapoints → 4 pool databases' },
              { from: 'High confidence',   to: 'ADA dataset',        note: '>0.85 confidence → 6M target archive' },
              { from: 'AfriScout',         to: 'afrifoundry-field',  note: 'Sacred — scrapers never overwrite field data' },
            ].map(({ from, to, note }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-zinc-400 w-36 flex-shrink-0">{from}</span>
                <span className="text-brand-green/50">→</span>
                <span className="text-zinc-300 w-32 flex-shrink-0">{to}</span>
                <span className="text-zinc-700">{note}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Run history */}
      {history.length > 0 && (
        <Section title={`Run History (${history.length})`}>
          <Card className="divide-y divide-border">
            {history.slice(0, 10).map((run, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-surface-2 transition-colors">
                <Dot status={run.status === 'completed' ? 'healthy' : run.status === 'failed' ? 'error' : 'warning'} />
                <span className="font-mono text-[10px] text-zinc-400 w-28 flex-shrink-0">
                  {run.started_at ? new Date(run.started_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <span className="font-mono text-[10px] text-zinc-600 flex-1">
                  {fmt(run.inserted)} inserted · {fmt(run.updated)} updated · {run.duration_minutes ? `${run.duration_minutes}min` : '—'}
                </span>
                <Pill color={run.status === 'completed' ? 'green' : run.status === 'failed' ? 'red' : 'amber'}>
                  {run.status || '—'}
                </Pill>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
