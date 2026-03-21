'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDBList, getADAStats, getPriceChanges, confirmPriceChange, getFieldConflicts } from '../../../lib/api';
import { Spinner, ErrState, Section, Card, Dot, Pill, Btn, fmt } from '../../../components/shared';

const DB_LABEL = {
  'afrifoundry-ai':    { role: 'MAIN',    color: 'green' },
  'afrifoundry-data2': { role: 'RAW',     color: 'amber' },
  'pool-db-2':         { role: 'Pool 1',  color: 'default' },
  'pool-db-3':         { role: 'Pool 2',  color: 'default' },
  'pool-db-4':         { role: 'Pool 3',  color: 'default' },
  'pool-db-5':         { role: 'Pool 4',  color: 'default' },
  'pool-db-6':         { role: 'Pool 5',  color: 'default' },
  'afrifoundry-field': { role: 'FIELD',   color: 'amber' },
  'ada-stage':         { role: 'ADA',     color: 'blue' },
  'App DB':            { role: 'APP',     color: 'default' },
};

export default function DatabasesPage() {
  const [tab,      setTab]      = useState('overview');
  const [dbs,      setDbs]      = useState([]);
  const [ada,      setAda]      = useState(null);
  const [changes,  setChanges]  = useState([]);
  const [conflicts,setConflicts]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, a, c, cf] = await Promise.all([
        getDBList(),
        getADAStats(),
        getPriceChanges(),
        getFieldConflicts(),
      ]);
      setDbs(Array.isArray(d?.databases) ? d.databases : Array.isArray(d) ? d : []);
      setAda(a);
      setChanges(Array.isArray(c?.changes) ? c.changes : Array.isArray(c) ? c : []);
      setConflicts(Array.isArray(cf?.conflicts) ? cf.conflicts : Array.isArray(cf) ? cf : []);
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirm = async (id) => {
    try { await confirmPriceChange(id); }
    catch {}
    setChanges(prev => prev.map(c => c.id === id ? { ...c, confirmed: true } : c));
  };

  if (loading) return <Spinner />;
  if (err) return <ErrState msg={err} onRetry={load} />;

  const totalPts = dbs.reduce((s, d) => s + (d.datapoint_count || d.row_count || 0), 0);
  const tabs = ['overview', 'price changes', 'field conflicts', 'ada'];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-1 border border-brand-green/30 rounded-lg p-4 flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Total Datapoints</span>
          <span className="font-syne font-bold text-2xl text-brand-green">{fmt(totalPts)}</span>
        </div>
        <div className="bg-surface-1 border border-border rounded-lg p-4 flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Databases</span>
          <span className="font-syne font-bold text-2xl text-white">{dbs.length}</span>
        </div>
        <div className="bg-surface-1 border border-border rounded-lg p-4 flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Price Changes</span>
          <span className={`font-syne font-bold text-2xl ${changes.filter(c => !c.confirmed).length > 0 ? 'text-amber-400' : 'text-white'}`}>
            {changes.filter(c => !c.confirmed).length}
          </span>
          <span className="font-mono text-[9px] text-zinc-700">pending</span>
        </div>
        <div className="bg-surface-1 border border-blue-400/20 rounded-lg p-4 flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">ADA Progress</span>
          <span className="font-syne font-bold text-2xl text-blue-400">{fmt(ada?.total_datapoints)}</span>
          <span className="font-mono text-[9px] text-zinc-700">of 6M target</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-[9px] uppercase tracking-widest px-4 py-2 border-b-2 transition-colors ${tab === t ? 'border-brand-green text-brand-green' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-2">
          {dbs.map((db, i) => {
            const meta  = DB_LABEL[db.name] || DB_LABEL[db.db_id] || { role: db.db_id, color: 'default' };
            const sizeMB = db.size_mb || db.size_bytes ? Math.round((db.size_bytes || db.size_mb * 1024 * 1024) / 1024 / 1024) : null;
            const pct   = sizeMB ? Math.min(100, Math.round((sizeMB / 512) * 100)) : null;
            return (
              <Card key={i} className="p-4 flex items-center gap-4">
                <div className="w-28 flex-shrink-0">
                  <Pill color={meta.color}>{meta.role}</Pill>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-zinc-300 truncate">{db.name || db.db_id}</p>
                  {pct != null && (
                    <div className="mt-1.5 h-1 bg-surface-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-brand-green/40'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-[11px] text-zinc-300">{fmt(db.datapoint_count || db.row_count)} pts</p>
                  {sizeMB != null && <p className="font-mono text-[9px] text-zinc-600 mt-0.5">{sizeMB} MB · {pct}%</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Price changes tab */}
      {tab === 'price changes' && (
        <Section title="Price Changes" sub="Detected by the cleaning pipeline — confirm or review">
          {changes.length === 0 ? (
            <Card className="p-8 text-center">
              <span className="font-mono text-[10px] text-brand-green">✓ No pending price changes</span>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {changes.map((c, i) => (
                <div key={c.id || i} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-zinc-300">{c.item}</p>
                    <p className="font-mono text-[9px] text-zinc-600">
                      {fmt(c.old_value)} → <span className="text-zinc-300">{fmt(c.new_value)}</span>
                      {c.change_pct != null && (
                        <span className={` ml-2 ${c.change_pct > 0 ? 'text-red-400' : 'text-brand-green'}`}>
                          {c.change_pct > 0 ? '+' : ''}{c.change_pct?.toFixed(1)}%
                        </span>
                      )}
                      {c.geography_county && ` · ${c.geography_county}`}
                    </p>
                    <p className="font-mono text-[9px] text-zinc-700 mt-0.5">{c.change_reason || '—'}</p>
                  </div>
                  {c.confirmed ? (
                    <Pill color="green">Confirmed</Pill>
                  ) : (
                    <Btn small variant="green" onClick={() => confirm(c.id)}>Confirm</Btn>
                  )}
                </div>
              ))}
            </Card>
          )}
        </Section>
      )}

      {/* Field conflicts tab */}
      {tab === 'field conflicts' && (
        <Section title="Field Conflicts" sub="Scraper vs AfriScout — field data always wins">
          {conflicts.length === 0 ? (
            <Card className="p-8 text-center">
              <span className="font-mono text-[10px] text-brand-green">✓ No conflicts — field data is protected</span>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {conflicts.map((c, i) => (
                <div key={i} className="px-4 py-3 hover:bg-surface-2 transition-colors">
                  <p className="font-mono text-[10px] text-zinc-300">{c.item}</p>
                  <div className="flex gap-6 mt-1">
                    <div>
                      <span className="font-mono text-[9px] text-amber-400">AfriScout: </span>
                      <span className="font-mono text-[9px] text-zinc-300">{fmt(c.field_value)}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-zinc-600">Scraper: </span>
                      <span className="font-mono text-[9px] text-zinc-500">{fmt(c.scraper_value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </Section>
      )}

      {/* ADA tab */}
      {tab === 'ada' && (
        <Section title="African Dataset Archive (ADA)" sub="Accumulating silently to 6M certified datapoints">
          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Progress to 6M</span>
                <span className="font-mono text-[10px] text-blue-400">{fmt(ada?.total_datapoints)} / 6,000,000</span>
              </div>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400/60 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((ada?.total_datapoints || 0) / 6000000) * 100)}%` }} />
              </div>
              <p className="font-mono text-[9px] text-zinc-700 mt-2">
                {Math.round(((ada?.total_datapoints || 0) / 6000000) * 100)}% · Opens to AfriFoundry AI at 6M milestone
              </p>
            </Card>
            {ada && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Total Datapoints',    value: fmt(ada.total_datapoints) },
                  { label: 'Avg Confidence',       value: ada.avg_confidence ? `${(ada.avg_confidence * 100).toFixed(1)}%` : '—' },
                  { label: 'Countries',            value: fmt(ada.country_count) },
                  { label: 'Categories',           value: fmt(ada.category_count) },
                  { label: 'This Month',           value: fmt(ada.added_this_month) },
                  { label: 'To 6M Target',         value: fmt(Math.max(0, 6000000 - (ada.total_datapoints || 0))) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-1 border border-border rounded-lg px-3 py-2.5">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{label}</div>
                    <div className="font-mono text-xs text-zinc-300 mt-1">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
