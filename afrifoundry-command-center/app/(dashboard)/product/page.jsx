'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  StatCard, SectionHeader, Badge, ProgressBar, DataTable, LoadingSpinner,
} from '../../../components/ui';
import { getProductStats, getConversations } from '../../../lib/api';

const MOCK_STATS = {
  total_conversations: 1847,
  total_messages: 12340,
  active_users_7d: 89,
  thumbs_up: 742,
  thumbs_down: 93,
  quality_rate: 88.9,
  avg_response_ms: 1240,
  timeout_rate: 0.8,
  conversation_types: [
    { type: 'Business', count: 620, color: 'green' },
    { type: 'Farming', count: 480, color: 'amber' },
    { type: 'Health', count: 310, color: 'blue' },
    { type: 'Transport', count: 220, color: 'amber' },
    { type: 'General', count: 217, color: 'default' },
  ],
};

const MOCK_CONVERSATIONS = [
  { id: 'c001', user: 'james.k@gmail.com', type: 'Farming', preview: 'What should I plant in Kisumu this season?', messages: 8, time: '5m ago' },
  { id: 'c002', user: 'faith.m@tum.ac.ke', type: 'Business', preview: 'How do I register a business in Kenya?', messages: 12, time: '12m ago' },
  { id: 'c003', user: 'peter.o@yahoo.com', type: 'Health', preview: 'Best hospital in Nakuru for maternity?', messages: 6, time: '28m ago' },
  { id: 'c004', user: 'mary.w@gmail.com', type: 'Transport', preview: 'Matatu fares Nairobi to Thika?', messages: 4, time: '41m ago' },
  { id: 'c005', user: 'john.m@hotmail.com', type: 'Business', preview: 'How do I get an MPESA till number?', messages: 9, time: '55m ago' },
  { id: 'c006', user: 'grace.n@gmail.com', type: 'Farming', preview: 'Avocado prices in Murang\'a this week', messages: 5, time: '1h ago' },
  { id: 'c007', user: 'samuel.k@gmail.com', type: 'General', preview: 'Explain AfriFoundry to me', messages: 7, time: '1h ago' },
  { id: 'c008', user: 'anne.w@gmail.com', type: 'Health', preview: 'Signs of malaria in children under 5', messages: 11, time: '2h ago' },
];

const typeColor = { Business: 'green', Farming: 'amber', Health: 'blue', Transport: 'amber', General: 'default' };

export default function ProductPage() {
  const [stats, setStats] = useState(null);
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getProductStats(), getConversations()]);
      setStats(s?.error ? MOCK_STATS : s);
      setConvos(c?.error || !Array.isArray(c) ? MOCK_CONVERSATIONS : c);
    } catch {
      setStats(MOCK_STATS);
      setConvos(MOCK_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  const s = stats || MOCK_STATS;
  const total = s.conversation_types?.reduce((sum, t) => sum + t.count, 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Conversations" value={s.total_conversations?.toLocaleString()} accent />
        <StatCard label="Total Messages" value={s.total_messages?.toLocaleString()} accent />
        <StatCard label="Active Users (7d)" value={s.active_users_7d} />
        <StatCard label="Quality Rate" value={`${s.quality_rate}%`} sub="Thumbs up ratio" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Conversation type breakdown */}
        <div>
          <SectionHeader title="Conversation Types" sub="What Africans are asking about" />
          <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
            {s.conversation_types?.map((t) => (
              <ProgressBar
                key={t.type}
                label={t.type}
                value={t.count}
                max={total}
                color={t.color}
              />
            ))}
          </div>
        </div>

        {/* Feedback & streaming */}
        <div className="space-y-4">
          <div>
            <SectionHeader title="Feedback" />
            <div className="bg-surface-1 border border-border rounded-lg p-4 grid grid-cols-3 gap-3">
              <StatCard label="Thumbs Up" value={s.thumbs_up} />
              <StatCard label="Thumbs Down" value={s.thumbs_down} />
              <StatCard label="Quality" value={`${s.quality_rate}%`} accent />
            </div>
          </div>
          <div>
            <SectionHeader title="Streaming Health" />
            <div className="bg-surface-1 border border-border rounded-lg p-4 grid grid-cols-2 gap-3">
              <StatCard label="Avg Response" value={`${s.avg_response_ms}ms`} />
              <StatCard
                label="Timeout Rate"
                value={`${s.timeout_rate}%`}
                sub={s.timeout_rate < 2 ? 'Healthy' : 'Monitor'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conversations table */}
      <div>
        <SectionHeader title="Recent Conversations" sub="Last 30 across all users" />
        <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
          <DataTable
            columns={[
              { key: 'user', label: 'User' },
              {
                key: 'type', label: 'Type',
                render: (v) => <Badge variant={typeColor[v] || 'default'}>{v}</Badge>,
              },
              { key: 'preview', label: 'Preview' },
              { key: 'messages', label: 'Msgs' },
              { key: 'time', label: 'Time' },
            ]}
            rows={convos}
          />
        </div>
      </div>
    </div>
  );
}
