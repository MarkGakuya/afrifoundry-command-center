'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  StatCard, SectionHeader, StatusLight, Badge, DataTable,
  ActionButton, LoadingSpinner, ProgressBar,
} from '../../../components/ui';
import { getScrapers, getPipelineStats, getReviewQueue, approveDatapoint, rejectDatapoint } from '../../../lib/api';

const MOCK_PIPELINE = {
  scraped: 24800, normalized: 23100, validated: 21400, deduplicated: 20200, stored: 18420, review: 14,
};

const MOCK_SCRAPERS = Array.from({ length: 16 }, (_, i) => ({
  id: `S${String(i + 1).padStart(2, '0')}`,
  name: ['Wakulima Market', 'Kongowea', 'Gikomba', 'City Market', 'Marikiti', 'Eastleigh',
    'Toi Market', 'Limuru Road', 'Kangemi', 'Kawangware', 'Korogocho', 'Dagoretti',
    'Ngara', 'Shauri Moyo', 'Mama Ngina', 'Mombasa Port'][i],
  datapoints: [1240, 980, 2100, 760, 430, 890, 320, 540, 670, 480, 290, 720, 380, 450, 610, 340][i],
  last_run: ['2m ago', '18m ago', '34m ago', '1h ago', '2h ago', '3h ago',
    '4h ago', '5h ago', '6h ago', '7h ago', '8h ago', '10h ago',
    '12h ago', '14h ago', '16h ago', '18h ago'][i],
  status: ['healthy', 'healthy', 'healthy', 'warning', 'healthy', 'healthy',
    'healthy', 'warning', 'healthy', 'healthy', 'error', 'healthy',
    'healthy', 'healthy', 'healthy', 'healthy'][i],
}));

const MOCK_QUEUE = [
  { id: 'dp_001', item: 'Avocado (1kg)', value: 'KES 120', market: 'Wakulima', county: 'Nairobi', confidence: 0.58, source: 'S01' },
  { id: 'dp_002', item: 'Tomatoes (1kg)', value: 'KES 85', market: 'Kongowea', county: 'Mombasa', confidence: 0.61, source: 'S02' },
  { id: 'dp_003', item: 'Maize (1kg)', value: 'KES 65', market: 'Gikomba', county: 'Nairobi', confidence: 0.54, source: 'S03' },
  { id: 'dp_004', item: 'Sukuma Wiki (bunch)', value: 'KES 15', market: 'City Market', county: 'Nairobi', confidence: 0.62, source: 'S04' },
  { id: 'dp_005', item: 'Onions (1kg)', value: 'KES 95', market: 'Marikiti', county: 'Mombasa', confidence: 0.59, source: 'S05' },
];

export default function IntelligencePage() {
  const [pipeline, setPipeline] = useState(null);
  const [scrapers, setScrapers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, s, q] = await Promise.all([getPipelineStats(), getScrapers(), getReviewQueue()]);
      setPipeline(p?.error ? MOCK_PIPELINE : p);
      setScrapers(s?.error || !Array.isArray(s) ? MOCK_SCRAPERS : s);
      setQueue(q?.error || !Array.isArray(q) ? MOCK_QUEUE : q);
    } catch {
      setPipeline(MOCK_PIPELINE);
      setScrapers(MOCK_SCRAPERS);
      setQueue(MOCK_QUEUE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    await approveDatapoint(id).catch(() => {});
    setQueue((q) => q.filter((d) => d.id !== id));
  };
  const handleReject = async (id) => {
    await rejectDatapoint(id).catch(() => {});
    setQueue((q) => q.filter((d) => d.id !== id));
  };

  if (loading) return <LoadingSpinner />;

  const p = pipeline || MOCK_PIPELINE;
  const stages = [
    { label: 'Scraped', key: 'scraped' },
    { label: 'Normalized', key: 'normalized' },
    { label: 'Validated', key: 'validated' },
    { label: 'Deduplicated', key: 'deduplicated' },
    { label: 'Stored', key: 'stored' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Pipeline Flow */}
      <div>
        <SectionHeader title="Cleaning Pipeline" sub="Data flow from raw scrape to stored" />
        <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 w-24">{stage.label}</span>
              <div className="flex-1 h-6 bg-surface-3 rounded flex items-center px-3 relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-brand-green/10 rounded"
                  style={{ width: `${(p[stage.key] / p.scraped) * 100}%` }}
                />
                <span className="font-mono text-[11px] text-brand-green relative z-10">
                  {p[stage.key]?.toLocaleString()}
                </span>
              </div>
              {i < stages.length - 1 && (
                <span className="text-zinc-700 font-mono text-xs">↓</span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-amber w-24">Review Queue</span>
            <span className="font-mono text-sm text-brand-amber">{p.review} datapoints need manual review</span>
          </div>
        </div>
      </div>

      {/* Scraper Grid */}
      <div>
        <SectionHeader title={`Scrapers (${scrapers.length})`} sub="All active data scrapers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {scrapers.map((s) => (
            <div key={s.id} className="bg-surface-1 border border-border rounded-lg p-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] text-zinc-600">{s.id}</span>
                  <StatusLight status={s.status} />
                </div>
                <p className="font-mono text-[11px] text-zinc-300 leading-tight">{s.name}</p>
                <p className="font-mono text-[10px] text-zinc-600 mt-1">{s.datapoints?.toLocaleString()} pts</p>
              </div>
              <span className="font-mono text-[9px] text-zinc-600 shrink-0">{s.last_run}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Queue */}
      <div>
        <SectionHeader
          title={`Review Queue (${queue.length})`}
          sub="Datapoints with confidence < 0.65 — approve or reject"
        />
        {queue.length === 0 ? (
          <div className="bg-surface-1 border border-border rounded-lg p-8 text-center font-mono text-xs text-brand-green">
            ✓ Queue is clear
          </div>
        ) : (
          <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
            {queue.map((dp) => (
              <div key={dp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-zinc-300">{dp.item}</p>
                  <p className="font-mono text-[10px] text-zinc-600">{dp.value} · {dp.market}, {dp.county} · src: {dp.source}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono text-[10px] ${dp.confidence < 0.6 ? 'text-brand-red' : 'text-brand-amber'}`}>
                    {(dp.confidence * 100).toFixed(0)}%
                  </span>
                  <ActionButton variant="green" onClick={() => handleApprove(dp.id)}>✓</ActionButton>
                  <ActionButton variant="red" onClick={() => handleReject(dp.id)}>✗</ActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
