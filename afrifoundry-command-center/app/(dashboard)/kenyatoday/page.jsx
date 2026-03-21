'use client';

import { useEffect, useState, useCallback } from 'react';
import { getKenyaToday, updateKenyaToday } from '../../../lib/api';
import { Spinner, ErrState, Section, Card, Btn } from '../../../components/shared';

const TEMPLATES = [
  {
    label: 'Fuel Price Update',
    icon: '⛽',
    text: `FUEL PRICES (updated ${new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}):\nPetrol: KES [PRICE]/litre\nDiesel: KES [PRICE]/litre\nKerosene: KES [PRICE]/litre\nSource: EPRA`,
  },
  {
    label: 'CBK Rate Change',
    icon: '🏦',
    text: `CBK BASE LENDING RATE: [RATE]% (effective [DATE])\nThis affects: bank loans, SACCO lending rates, mortgage rates.\nContext: Rate [increased/decreased] from [OLD]% — [brief reason].`,
  },
  {
    label: 'Seasonal Alert',
    icon: '🌧',
    text: `SEASONAL CONTEXT (${new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}):\n[Season type] season. Key implications:\n- Farmers: [planting/harvesting] window for [crops]\n- Transport: [road conditions]\n- Prices: [expected direction] for [commodities]\n- Business: [demand pattern]`,
  },
  {
    label: 'Market Condition',
    icon: '📊',
    text: `CURRENT MARKET CONDITIONS:\nUSD/KES: [RATE]\nNSE (main): [DIRECTION] [PCT]% this week\nFood inflation: [PCT]% (latest KNBS)\nFuel price trend: [DIRECTION]\nKey note: [Any significant market development]`,
  },
  {
    label: 'General Alert',
    icon: '⚡',
    text: `IMPORTANT CONTEXT FOR USERS TODAY:\n[Write your alert here — regulatory change, major policy announcement, economic event, or anything that affects decisions Africans are making right now]`,
  },
];

export default function KenyaTodayPage() {
  const [current,  setCurrent]  = useState(null);
  const [draft,    setDraft]    = useState('');
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');
  const [preview,  setPreview]  = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getKenyaToday();
      const content = data?.content || data?.text || data?.kenya_today || '';
      setCurrent(content);
      setDraft(content);
      setHistory(data?.history || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setSaveMsg('Saving...');
    try {
      await updateKenyaToday({ content: draft, text: draft, kenya_today: draft });
      setCurrent(draft);
      setSaveMsg('✓ Saved — now injected into every conversation');
    } catch (e) {
      setSaveMsg(`✗ ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  const useTemplate = (template) => {
    setDraft(template.text);
    setPreview(false);
  };

  const isDirty = draft !== current;

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* What is Kenya Today */}
      <Card className="px-4 py-3 border-brand-green/20">
        <p className="font-mono text-[10px] text-zinc-400">
          Kenya Today is injected into <span className="text-brand-green">every conversation</span> as live market context.
          It tells the AI what is happening right now — fuel prices, exchange rates, seasonal conditions, CBK announcements.
          Update it whenever something significant changes in the Kenyan economy.
        </p>
      </Card>

      {/* Current active content */}
      <Section
        title="Active Content"
        sub="Currently injected into every AfriFoundry conversation"
        action={
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_5px_#00ff88]" />
            <span className="font-mono text-[9px] text-brand-green uppercase tracking-widest">Live</span>
          </div>
        }
      >
        {current ? (
          <Card className="p-4">
            <pre className="font-mono text-[10px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{current}</pre>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <span className="font-mono text-[10px] text-zinc-700">No Kenya Today content set. Add content below.</span>
          </Card>
        )}
      </Section>

      {/* Quick templates */}
      <Section title="Quick Templates">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.label} onClick={() => useTemplate(t)}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border border-border text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 rounded transition-colors">
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Editor */}
      <Section
        title="Editor"
        sub={isDirty ? '● Unsaved changes' : 'No changes'}
        action={
          <div className="flex items-center gap-2">
            <Btn onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </Btn>
            <Btn variant="green" disabled={saving || !isDirty || !draft.trim()} onClick={save}>
              {saving ? '⟳ Saving...' : '↑ Save & Activate'}
            </Btn>
          </div>
        }
      >
        {preview ? (
          <Card className="p-4">
            <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mb-3">
              Preview — how it appears in the AI context:
            </div>
            <div className="bg-surface-3 rounded p-3">
              <div className="font-mono text-[9px] text-zinc-600 mb-2">--- KENYA TODAY (injected context) ---</div>
              <pre className="font-mono text-[10px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{draft}</pre>
              <div className="font-mono text-[9px] text-zinc-600 mt-2">--- END KENYA TODAY ---</div>
            </div>
          </Card>
        ) : (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Write what's happening in Kenya today — fuel prices, exchange rate, seasonal conditions, market news, CBK announcement, anything that affects decisions Africans are making right now..."
            className="w-full h-52 bg-surface-1 border border-border rounded-lg px-4 py-3 font-mono text-[11px] text-white placeholder-zinc-700 focus:outline-none focus:border-brand-green/40 resize-none transition-colors"
          />
        )}
        {saveMsg && (
          <p className={`font-mono text-[10px] mt-2 ${saveMsg.startsWith('✓') ? 'text-brand-green' : 'text-red-400'}`}>
            {saveMsg}
          </p>
        )}
        {isDirty && !saveMsg && (
          <p className="font-mono text-[9px] text-amber-400 mt-2">
            ⚠ Unsaved — click Save & Activate to make this live
          </p>
        )}
      </Section>

      {/* History */}
      {history.length > 0 && (
        <Section title={`Update History (${history.length})`}>
          <Card className="divide-y divide-border">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className="px-4 py-3 hover:bg-surface-2 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] text-zinc-600">
                    {h.updated_at ? new Date(h.updated_at).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '—'}
                  </span>
                  <button onClick={() => setDraft(h.content || h.text || '')}
                    className="font-mono text-[9px] text-zinc-600 hover:text-zinc-300 transition-colors">
                    Restore
                  </button>
                </div>
                <p className="font-mono text-[10px] text-zinc-500 truncate">
                  {(h.content || h.text || '').slice(0, 120)}...
                </p>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
