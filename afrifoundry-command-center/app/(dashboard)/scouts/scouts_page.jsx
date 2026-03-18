'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  StatCard, SectionHeader, Badge, DataTable, LoadingSpinner,
} from '../../../components/ui';
import { getScouts, getScoutFeed } from '../../../lib/api';
import dynamic from 'next/dynamic';

const ScoutsMap = dynamic(() => import('./ScoutsMap'), { ssr: false });

const MOCK_SCOUTS = [
  { id: 's01', name: 'Mark Gakuya', county: 'Mombasa', collections_week: 47, quality_score: 94, status: 'active', last_sync: '2h ago' },
  { id: 's02', name: 'James Otieno', county: 'Nairobi', collections_week: 38, quality_score: 91, status: 'active', last_sync: '4h ago' },
  { id: 's03', name: 'Faith Wanjiru', county: 'Kiambu', collections_week: 29, quality_score: 88, status: 'active', last_sync: '1d ago' },
  { id: 's04', name: 'Peter Kamau', county: 'Nakuru', collections_week: 21, quality_score: 85, status: 'idle', last_sync: '3d ago' },
  { id: 's05', name: 'Grace Akinyi', county: 'Kisumu', collections_week: 33, quality_score: 90, status: 'active', last_sync: '6h ago' },
];

const MOCK_FEED = [
  { scout: 'Mark G.', item: 'Avocado (1kg)', value: 'KES 120', market: 'Kongowea', county: 'Mombasa', time: '2h ago' },
  { scout: 'James O.', item: 'Tomatoes (1kg)', value: 'KES 90', market: 'Wakulima', county: 'Nairobi', time: '4h ago' },
  { scout: 'Grace A.', item: 'Tilapia (1kg)', value: 'KES 450', market: 'Kibuye', county: 'Kisumu', time: '6h ago' },
  { scout: 'Mark G.', item: 'Maize flour (2kg)', value: 'KES 185', market: 'Likoni', county: 'Mombasa', time: '8h ago' },
  { scout: 'Faith W.', item: 'Milk (1L)', value: 'KES 60', market: 'Limuru', county: 'Kiambu', time: '1d ago' },
  { scout: 'James O.', item: 'Sukuma Wiki (bunch)', value: 'KES 15', market: 'Gikomba', county: 'Nairobi', time: '1d ago' },
  { scout: 'Grace A.', item: 'Omena (250g)', value: 'KES 80', market: 'Kisumo Ndogo', county: 'Kisumu', time: '1d ago' },
];

// Kenya counties map approximation — dots representing coverage
const KENYA_DOTS = [
  { county: 'Nairobi', x: 52, y: 58, active: true },
  { county: 'Mombasa', x: 72, y: 78, active: true },
  { county: 'Kisumu', x: 28, y: 52, active: true },
  { county: 'Nakuru', x: 40, y: 48, active: true },
  { county: 'Kiambu', x: 50, y: 54, active: true },
  { county: 'Eldoret', x: 32, y: 38, active: false },
  { county: 'Machakos', x: 58, y: 62, active: false },
  { county: 'Nyeri', x: 52, y: 42, active: false },
  { county: 'Meru', x: 60, y: 38, active: false },
  { county: 'Garissa', x: 72, y: 46, active: false },
  { county: 'Turkana', x: 30, y: 20, active: false },
  { county: 'Kakamega', x: 26, y: 44, active: false },
];

export default function ScoutsPage() {
  const [scouts, setScouts] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([getScouts(), getScoutFeed()]);
      setScouts(Array.isArray(s) && !s.error ? s : MOCK_SCOUTS);
      setFeed(Array.isArray(f) && !f.error ? f : MOCK_FEED);
    } catch {
      setScouts(MOCK_SCOUTS);
      setFeed(MOCK_FEED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  const activeScouts = scouts.filter((s) => s.status === 'active').length;
  const totalCollections = scouts.reduce((sum, s) => sum + (s.collections_week || 0), 0);
  const avgQuality = scouts.length
    ? Math.round(scouts.reduce((sum, s) => sum + (s.quality_score || 0), 0) / scouts.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Scouts" value={scouts.length} accent />
        <StatCard label="Active Scouts" value={activeScouts} />
        <StatCard label="Collections This Week" value={totalCollections} />
        <StatCard label="Avg Quality Score" value={`${avgQuality}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kenya Coverage Map — Live */}
        <div>
          <SectionHeader title="Kenya Coverage Map" sub="Scout locations · Hover for details" />
          <div className="bg-surface-1 border border-border rounded-lg p-4">
            <ScoutsMap />
          </div>
        </div>

        {/* Scout list */}
        <div>
          <SectionHeader title="Scout Network" sub="Field collectors by county" />
          <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
            <DataTable
              columns={[
                { key: 'name', label: 'Scout' },
                { key: 'county', label: 'County' },
                { key: 'collections_week', label: 'This Week' },
                {
                  key: 'quality_score', label: 'Quality',
                  render: (v) => (
                    <span className={`font-mono text-[11px] ${v >= 90 ? 'text-brand-green' : v >= 80 ? 'text-brand-amber' : 'text-brand-red'}`}>
                      {v}%
                    </span>
                  ),
                },
                {
                  key: 'status', label: 'Status',
                  render: (v) => <Badge variant={v === 'active' ? 'green' : 'default'}>{v}</Badge>,
                },
              ]}
              rows={scouts}
            />
          </div>
        </div>
      </div>

      {/* Scout Sync Feed */}
      <div>
        <SectionHeader title="Scout Sync Feed" sub="Latest datapoints submitted from the field" />
        <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
          {feed.map((event, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
              <span className="font-mono text-brand-amber text-sm">◉</span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] text-zinc-300">
                  <span className="text-zinc-500">{event.scout}</span>
                  {' → '}
                  {event.item}
                  {' · '}
                  <span className="text-brand-green">{event.value}</span>
                </p>
                <p className="font-mono text-[10px] text-zinc-600">{event.market}, {event.county}</p>
              </div>
              <span className="font-mono text-[10px] text-zinc-600 shrink-0">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
