'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMilestones, getFundingPipeline, getRevenue } from '../../../lib/api';
import { Spinner, Stat, Section, Card, Pill } from '../../../components/shared';

const STATUS_COLOR = { applying: 'green', meeting: 'amber', submitted: 'blue', research: 'default', rejected: 'red' };

export default function CompanyPage() {
  const [milestones, setMilestones] = useState([]);
  const [funding,    setFunding]    = useState([]);
  const [revenue,    setRevenue]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    const [m, f, r] = await Promise.all([getMilestones(), getFundingPipeline(), getRevenue()]);
    setMilestones(m);
    setFunding(f);
    setRevenue(r);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  const done = milestones.filter(m => m.done).length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Revenue */}
      <Section title="Revenue" sub="Live once M-Pesa integration is active">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="MRR"             value={revenue?.mrr ? `KES ${revenue.mrr.toLocaleString()}` : 'KES 0'} />
          <Stat label="Total Revenue"   value={revenue?.total_revenue ? `KES ${revenue.total_revenue.toLocaleString()}` : 'KES 0'} />
          <Stat label="Active Pro Users" value={revenue?.active_pro_users || 0} />
          <Stat label="Status"          value={revenue?.status || 'Pre-revenue'} sub="M-Pesa integration pending" />
        </div>
      </Section>

      {/* Milestones */}
      <Section title={`Company Milestones (${done}/${milestones.length})`} sub="The build so far">
        <Card className="divide-y divide-border">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors">
              <span className={`font-mono text-sm flex-shrink-0 ${m.done ? 'text-brand-green' : 'text-zinc-700'}`}>
                {m.done ? '✓' : '○'}
              </span>
              <span className={`flex-1 font-mono text-[10px] ${m.done ? 'text-zinc-300' : 'text-zinc-600'}`}>{m.label}</span>
              <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">{m.date}</span>
            </div>
          ))}
        </Card>
      </Section>

      {/* Funding pipeline */}
      <Section title={`Funding Pipeline (${funding.length})`} sub="Active and tracked opportunities">
        <Card className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Opportunity', 'Type', 'Amount', 'Deadline', 'Status', 'Next Action'].map(h => (
                  <th key={h} className="text-left text-[9px] uppercase tracking-widest text-zinc-600 pb-2 pr-4 pt-3 px-4 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funding.map((f, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                  <td className="py-2 pr-4 px-4 text-zinc-300">{f.name}</td>
                  <td className="py-2 pr-4 text-zinc-500">{f.type}</td>
                  <td className="py-2 pr-4 text-zinc-400">{f.amount}</td>
                  <td className="py-2 pr-4 text-zinc-600">{f.deadline}</td>
                  <td className="py-2 pr-4"><Pill color={STATUS_COLOR[f.status] || 'default'}>{f.status}</Pill></td>
                  <td className="py-2 pr-4 text-zinc-600">{f.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* Version roadmap */}
      <Section title="Version Roadmap" sub="V1 → V5">
        <Card className="divide-y divide-border">
          {[
            { v: 'V1', name: 'The Foundation',  timeline: 'Mar 2026',  done: true,  desc: 'Full thinking partner — 2.5M datapoints, 6 user contexts, all languages via prompt' },
            { v: 'V2', name: 'The Language',    timeline: 'Q3 2026',  done: false, desc: 'Fine-tuned model + proactive intelligence — AfriFoundry comes to you when the world changes' },
            { v: 'V3', name: 'The Network',     timeline: 'Q4 2026',  done: false, desc: 'Opted-in market matching + collective intelligence — the AI that finds customers' },
            { v: 'V4', name: 'The Executor',    timeline: 'Q2 2027',  done: false, desc: 'Agent layer — AfriFoundry does work, not just advises' },
            { v: 'V5', name: 'The Platform',    timeline: '2027+',    done: false, desc: 'African Intelligence Layer API — institutional access, developer platform, pan-Africa' },
          ].map((ver) => (
            <div key={ver.v} className="flex items-start gap-4 px-4 py-3 hover:bg-surface-2 transition-colors">
              <span className={`font-mono text-xs font-bold w-6 flex-shrink-0 mt-0.5 ${ver.done ? 'text-brand-green' : 'text-zinc-600'}`}>{ver.v}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] ${ver.done ? 'text-zinc-300' : 'text-zinc-500'}`}>{ver.name}</span>
                  {ver.done && <span className="font-mono text-[8px] text-brand-green border border-brand-green/30 px-1.5 py-0.5 rounded">SHIPPED</span>}
                </div>
                <p className="font-mono text-[9px] text-zinc-700 mt-0.5 leading-relaxed">{ver.desc}</p>
              </div>
              <span className="font-mono text-[9px] text-zinc-700 flex-shrink-0">{ver.timeline}</span>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}
