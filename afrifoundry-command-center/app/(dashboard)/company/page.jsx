'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard, SectionHeader, Badge, DataTable, LoadingSpinner } from '../../../components/ui';
import { getMilestones, getFundingPipeline, getRevenue } from '../../../lib/api';

const MOCK_MILESTONES = [
  { label: 'Founded AfriFoundry', date: '8 Jul 2025', done: true },
  { label: 'AfriScout V3 live', date: 'Sep 2025', done: true },
  { label: 'AfriFoundry AI live (Founding 100)', date: 'Feb 2026', done: true },
  { label: 'Command Center live', date: 'Mar 2026', done: false },
  { label: 'First paying customer', date: 'Q2 2026', done: false },
  { label: 'Company registration', date: 'Q2 2026', done: false },
  { label: 'First enterprise client', date: 'Q3 2026', done: false },
  { label: 'AfriFoundry Dataset V1 published', date: 'Q4 2026', done: false },
];

const MOCK_REVENUE = {
  mrr: 0,
  total_revenue: 0,
  active_pro_users: 0,
  status: 'pre-revenue',
};

const MOCK_FUNDING = [
  { name: 'Google.org', type: 'Grant', amount: '$100K–$500K', deadline: 'Apr 3, 2026', status: 'applying', next: 'Submit application' },
  { name: 'Louis (angel)', type: 'Angel', amount: 'TBD', deadline: 'This week', status: 'meeting', next: 'Meeting this week' },
  { name: 'Kevin (angel)', type: 'Angel', amount: 'TBD', deadline: 'This week', status: 'meeting', next: 'Meeting this week' },
  { name: 'Nelima', type: 'Partner/Investor', amount: 'TBD', deadline: 'Thu Mar 20', status: 'meeting', next: 'Meeting Thursday' },
  { name: 'Villgro Africa', type: 'Incubator', amount: '$50K–$200K', deadline: 'Q2 2026', status: 'research', next: 'Prepare pitch deck' },
  { name: 'Antler Africa', type: 'VC', amount: '$100K+', deadline: 'Q2 2026', status: 'research', next: 'Apply to cohort' },
  { name: 'GSMA Innovation Fund', type: 'Grant', amount: '$75K–$250K', deadline: 'Q3 2026', status: 'research', next: 'Monitor open call' },
  { name: 'Africa50', type: 'VC', amount: '$250K+', deadline: 'Q3 2026', status: 'research', next: 'Warm intro needed' },
];

const statusVariant = {
  applying: 'green',
  meeting: 'amber',
  research: 'default',
  submitted: 'blue',
  rejected: 'red',
};

export default function CompanyPage() {
  const [milestones, setMilestones] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [funding, setFunding] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, r, f] = await Promise.all([getMilestones(), getRevenue(), getFundingPipeline()]);
      setMilestones(Array.isArray(m) ? m : MOCK_MILESTONES);
      setRevenue(r?.error ? MOCK_REVENUE : r || MOCK_REVENUE);
      setFunding(Array.isArray(f) ? f : MOCK_FUNDING);
    } catch {
      setMilestones(MOCK_MILESTONES);
      setRevenue(MOCK_REVENUE);
      setFunding(MOCK_FUNDING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  const done = milestones.filter((m) => m.done).length;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Revenue */}
      <div>
        <SectionHeader title="Revenue" sub="Live once M-Pesa integration is active" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="MRR"
            value={revenue?.mrr ? `KES ${revenue.mrr.toLocaleString()}` : 'KES 0'}
          />
          <StatCard
            label="Total Revenue"
            value={revenue?.total_revenue ? `KES ${revenue.total_revenue.toLocaleString()}` : 'KES 0'}
          />
          <StatCard label="Active Pro Users" value={revenue?.active_pro_users || 0} />
          <StatCard
            label="Status"
            value={revenue?.status || 'Pre-revenue'}
            sub="M-Pesa integration pending"
          />
        </div>
      </div>

      {/* Milestones */}
      <div>
        <SectionHeader title={`Company Milestones (${done}/${milestones.length})`} sub="The build so far" />
        <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <span className={`font-mono text-sm ${m.done ? 'text-brand-green' : 'text-zinc-700'}`}>
                {m.done ? '✓' : '○'}
              </span>
              <span className={`flex-1 font-mono text-[11px] ${m.done ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {m.label}
              </span>
              <span className="font-mono text-[10px] text-zinc-600">{m.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Funding Pipeline */}
      <div>
        <SectionHeader
          title={`Funding Pipeline (${funding.length} opportunities)`}
          sub="All active and tracked opportunities"
        />
        <div className="bg-surface-1 border border-border rounded-lg overflow-x-auto">
          <DataTable
            columns={[
              { key: 'name', label: 'Opportunity' },
              { key: 'type', label: 'Type' },
              { key: 'amount', label: 'Amount' },
              { key: 'deadline', label: 'Deadline' },
              {
                key: 'status', label: 'Status',
                render: (v) => <Badge variant={statusVariant[v] || 'default'}>{v}</Badge>,
              },
              { key: 'next', label: 'Next Action' },
            ]}
            rows={funding}
          />
        </div>
      </div>
    </div>
  );
}
