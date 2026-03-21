'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPipelineStats, exportFinetune, getQualityTracking } from '../../../lib/api';
import { Spinner, ErrState, Stat, Section, Card, Pill, Btn, fmt } from '../../../components/shared';

const GOLD_TARGET = 500;

export default function FinetunePage() {
  const [stats,   setStats]   = useState(null);
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, q] = await Promise.all([
        getPipelineStats(),
        getQualityTracking(),
      ]);
      setStats(s);
      setQuality(q);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doExport = async () => {
    setExporting(true);
    setExportMsg('Exporting training data...');
    try {
      const res = await exportFinetune();
      const lines = res?.training_examples || res?.total || res?.count || '—';
      setExportMsg(`✓ Export complete — ${fmt(lines)} training examples ready`);
    } catch (e) {
      setExportMsg(`✗ Export failed: ${e.message}`);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 6000);
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const gold     = stats?.gold_conversations     || stats?.gold_count     || 0;
  const good     = stats?.good_conversations     || stats?.good_count     || 0;
  const total    = stats?.total_conversations    || 0;
  const eligible = stats?.eligible_conversations || gold + good || 0;
  const pct      = Math.min(100, Math.round((gold / GOLD_TARGET) * 100));
  const rate     = quality?.daily_rate || quality?.conversations_per_day || 0;
  const daysLeft = rate > 0 ? Math.ceil((GOLD_TARGET - gold) / rate) : null;

  const qualityLevels = [
    { label: 'Gold',      count: gold,                               color: 'text-brand-green', desc: 'depth_score ≥ 40, turns ≥ 3, labelled gold' },
    { label: 'Good',      count: good,                               color: 'text-amber-400',   desc: 'depth_score ≥ 25, turns ≥ 2' },
    { label: 'Needs Work',count: stats?.needs_work_count || 0,       color: 'text-zinc-500',    desc: 'Short or low quality' },
    { label: 'Poor',      count: stats?.poor_count || 0,             color: 'text-red-400',     desc: 'Depth score < 15' },
  ];

  const runs = stats?.training_runs || quality?.training_runs || [];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Progress to 500 gold */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Progress to First Training Run</div>
            <div className="font-syne font-bold text-3xl text-brand-green mt-1">{fmt(gold)} <span className="text-zinc-600 text-lg font-mono font-normal">/ {fmt(GOLD_TARGET)} gold</span></div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Est. completion</div>
            <div className="font-mono text-sm text-zinc-300 mt-1">
              {daysLeft != null ? `~${daysLeft} days at current rate` : 'Rate unknown'}
            </div>
            {rate > 0 && (
              <div className="font-mono text-[9px] text-zinc-600 mt-0.5">{rate.toFixed(1)} gold convos/day</div>
            )}
          </div>
        </div>
        <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-green transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[9px] text-zinc-600">{pct}% complete</span>
          <span className="font-mono text-[9px] text-zinc-600">{fmt(GOLD_TARGET - gold)} remaining</span>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Gold Conversations"     value={fmt(gold)}     accent />
        <Stat label="Eligible (Gold + Good)" value={fmt(eligible)} />
        <Stat label="Total Conversations"    value={fmt(total)} />
        <Stat label="Quality Rate"           value={stats?.quality_rate ? `${stats.quality_rate}%` : '—'} sub="Thumbs up ratio" />
      </div>

      {/* Quality breakdown */}
      <Section title="Conversation Quality Breakdown">
        <Card className="divide-y divide-border">
          {qualityLevels.map(({ label, count, color, desc }) => (
            <div key={label} className="flex items-center gap-4 px-4 py-3">
              <span className={`font-mono text-[10px] font-bold w-20 flex-shrink-0 ${color}`}>{label}</span>
              <span className={`font-syne font-bold text-lg w-16 flex-shrink-0 ${color}`}>{fmt(count)}</span>
              <span className="font-mono text-[9px] text-zinc-600 flex-1">{desc}</span>
              {total > 0 && (
                <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">
                  {Math.round((count / total) * 100)}%
                </span>
              )}
            </div>
          ))}
        </Card>
      </Section>

      {/* Export */}
      <Section title="Export Training Data" sub="Generates train.jsonl + eval.jsonl for QLoRA fine-tuning">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] text-zinc-400">
                Exports all gold and good conversations in JSONL format. Splits 80/20 train/eval.
                Strips internal tags. Ready for Kaggle QLoRA notebook.
              </p>
              <p className="font-mono text-[9px] text-zinc-600">
                Target: {fmt(GOLD_TARGET)} gold conversations · Current: {fmt(gold)} ({pct}%)
              </p>
            </div>
            <Btn variant="green" disabled={exporting || gold < 50} onClick={doExport}>
              {exporting ? '⟳ Exporting...' : '↓ Export JSONL'}
            </Btn>
          </div>
          {gold < 50 && (
            <p className="font-mono text-[9px] text-amber-400 mt-3">
              ⚠ Minimum 50 gold conversations needed for meaningful training. Currently at {gold}.
            </p>
          )}
          {exportMsg && (
            <p className="font-mono text-[10px] text-brand-green mt-3">{exportMsg}</p>
          )}
        </Card>
      </Section>

      {/* Training runs history */}
      <Section title="Training Run History" sub="Past QLoRA fine-tuning runs">
        {runs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-mono text-[10px] text-zinc-700">No training runs yet</p>
            <p className="font-mono text-[9px] text-zinc-800 mt-1">
              First run triggers when {fmt(GOLD_TARGET)} gold conversations are collected
            </p>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Examples', 'Epochs', 'Eval Loss', 'Model', 'Status'].map(h => (
                    <th key={h} className="text-left text-[9px] uppercase tracking-widest text-zinc-600 pb-2 pr-4 pt-3 px-4 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                    <td className="py-2 pr-4 px-4 text-zinc-400">
                      {run.date ? new Date(run.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-zinc-300">{fmt(run.examples)}</td>
                    <td className="py-2 pr-4 text-zinc-400">{run.epochs || '—'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{run.eval_loss?.toFixed(4) || '—'}</td>
                    <td className="py-2 pr-4 text-zinc-400">{run.model_name || '—'}</td>
                    <td className="py-2 pr-4">
                      <Pill color={run.status === 'deployed' ? 'green' : run.status === 'complete' ? 'blue' : 'amber'}>
                        {run.status || '—'}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

      {/* What happens at 500 */}
      <Section title="What Happens at 500 Gold Conversations">
        <Card className="p-4">
          <div className="space-y-3">
            {[
              { step: '1', text: 'Run export — generates train.jsonl (~400 examples) + eval.jsonl (~100 examples)' },
              { step: '2', text: 'Open Kaggle notebook (afrifoundry_finetune.ipynb) — upload JSONL, run 3 epochs on free T4 GPU (~3-4 hours)' },
              { step: '3', text: 'Download LoRA adapter weights, push to HuggingFace private repo' },
              { step: '4', text: 'Enable lora_integration.py in backend — drops in transparently, falls back to Groq if GPU unavailable' },
              { step: '5', text: 'AfriFoundry-1 serves every request. System prompt shrinks from 21K chars to ~2K. Quality target: 72% → 80-85%.' },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3">
                <span className="font-mono text-[9px] text-brand-green font-bold w-4 flex-shrink-0 mt-0.5">{step}.</span>
                <span className="font-mono text-[10px] text-zinc-400">{text}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}
