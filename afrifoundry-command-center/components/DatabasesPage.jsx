"use client";
import { useState, useEffect, useRef } from "react";

const API_BASE  = process.env.NEXT_PUBLIC_API_BASE || "https://afrifoundry-api.onrender.com";
const API_TOKEN = process.env.API_TOKEN || "";
const H = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${API_TOKEN}` });

const fmt  = (n) => (n ?? 0).toLocaleString();
const fmtMB = (mb) => mb >= 1024 ? `${(mb/1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;

// ── DB Colors ──────────────────────────────────────────────────────────────────
const COLORS = {
  main:  "#F97316", raw: "#64748b", pool2: "#60A5FA",
  field: "#10B981", pool4: "#A78BFA", app: "#FBBF24",
  ada:   "#F43F5E",
};

const SAMPLE_SQL = {
  main:  "SELECT item, value, unit, geography_county, confidence_score\nFROM scraped_datapoints\nWHERE industry_primary ILIKE '%agriculture%'\nORDER BY confidence_score DESC\nLIMIT 20",
  raw:   "SELECT scraper_id, COUNT(*) as count\nFROM raw_datapoints\nGROUP BY scraper_id\nORDER BY count DESC",
  pool2: "SELECT COUNT(*) as total, AVG(confidence_score) as avg_conf\nFROM scraped_datapoints",
  field: "SELECT item, value, geography_county, source_name, collected_date\nFROM field_datapoints\nORDER BY collected_date DESC\nLIMIT 20",
  pool4: "SELECT COUNT(*) FROM scraped_datapoints",
  app:   "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 20",
  ada:   "SELECT item, value, certification_level, confidence_score, geography_county\nFROM ada_datapoints\nORDER BY certified_at DESC\nLIMIT 20",
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function DatabasesPage() {
  const [overview, setOverview] = useState(null);
  const [dbDetails, setDbDetails] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDb, setSelectedDb] = useState("main");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/infrastructure/overview`, { headers: H() });
      const d = await r.json();
      setOverview(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDbDetails = async (dbId) => {
    if (dbDetails[dbId]) return;
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/db/${dbId}/stats`, { headers: H() });
      const d = await r.json();
      setDbDetails(prev => ({ ...prev, [dbId]: d }));
    } catch {}
  };

  const handleSelectDb = (dbId) => {
    setSelectedDb(dbId);
    setActiveTab("explorer");
    fetchDbDetails(dbId);
  };

  if (loading) return (
    <div style={S.page}>
      <div style={{ color: "#475569", fontSize: 14, padding: 40 }}>Loading databases...</div>
    </div>
  );

  const dbs = overview?.databases || {};

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>AfriFoundry — Data Infrastructure</div>
          <h1 style={S.title}>Database Manager</h1>
          <div style={S.subtitle}>
            {Object.values(dbs).filter(d => d.configured).length} databases active
            {overview?.pending_confirmations > 0 && (
              <span style={{ color: "#FBBF24", marginLeft: 12 }}>
                ● {overview.pending_confirmations} price changes need confirmation
              </span>
            )}
          </div>
        </div>
        <button onClick={fetchOverview} style={S.refreshBtn}>↻ Refresh</button>
      </div>

      {/* Tab bar */}
      <div style={S.tabs}>
        {[
          ["overview", "Overview"],
          ["explorer", "SQL Explorer"],
          ["price_changes", "Price Changes"],
          ["field_conflicts", "Field Conflicts"],
          ["ada", "ADA Progress"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ ...S.tab, ...(activeTab === id ? S.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>
        {activeTab === "overview"       && <OverviewTab dbs={dbs} onSelect={handleSelectDb} />}
        {activeTab === "explorer"       && <SQLExplorer dbs={dbs} initialDb={selectedDb} dbDetails={dbDetails} fetchDbDetails={fetchDbDetails} />}
        {activeTab === "price_changes"  && <PriceChangesTab />}
        {activeTab === "field_conflicts"&& <FieldConflictsTab />}
        {activeTab === "ada"            && <ADATab />}
      </div>
    </div>
  );
}


// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ dbs, onSelect }) {
  const order = ["main","pool2","field","pool4","raw","app","ada"];
  return (
    <div>
      <div style={S.dbGrid}>
        {order.map(dbId => {
          const db = dbs[dbId];
          if (!db) return null;
          const color = COLORS[dbId] || "#64748b";
          const pct = db.pct_full || 0;
          const barColor = pct > 85 ? "#EF4444" : pct > 65 ? "#FBBF24" : "#10B981";
          return (
            <div key={dbId} onClick={() => onSelect(dbId)}
              style={{ ...S.dbCard, borderTopColor: color, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ ...S.dbLabel, color }}>{db.label}</div>
                  {db.sacred && <div style={S.sacredBadge}>SACRED</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  {db.configured ? (
                    <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700 }}>
                      {fmtMB(db.size_mb || 0)}
                    </div>
                  ) : (
                    <div style={{ color: "#475569", fontSize: 12 }}>not set</div>
                  )}
                </div>
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 6, marginBottom: 10 }}>
                {db.description}
              </div>
              {db.configured && (
                <>
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width: `${Math.min(pct, 100)}%`, background: barColor }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#475569" }}>
                    <span>{pct}% of 512 MB</span>
                    <span style={{ color }}>→ Explore</span>
                  </div>
                </>
              )}
              {db.error && (
                <div style={{ color: "#fca5a5", fontSize: 11, marginTop: 6 }}>{db.error.slice(0, 80)}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Architecture diagram */}
      <div style={S.archBox}>
        <div style={S.archTitle}>Data Flow</div>
        <div style={S.archFlow}>
          {[
            { label: "Scrapers (50)", color: "#64748b" },
            { label: "↓", color: "#475569", arrow: true },
            { label: "RAW DB", color: COLORS.raw },
            { label: "↓ cleaning", color: "#475569", arrow: true },
            { label: "MAIN + Pool2 + Pool4", color: COLORS.main },
            { label: "↓ strict", color: "#475569", arrow: true },
            { label: "ADA (6M target)", color: COLORS.ada },
          ].map((item, i) => (
            <div key={i} style={{
              color: item.arrow ? "#475569" : item.color,
              fontWeight: item.arrow ? 400 : 700,
              fontSize: item.arrow ? 12 : 13,
              fontFamily: "monospace",
              padding: item.arrow ? "2px 0" : "4px 10px",
              background: item.arrow ? "transparent" : "#0d1929",
              borderRadius: 4,
              border: item.arrow ? "none" : `1px solid ${item.color}30`,
            }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ color: "#475569", fontSize: 11, marginTop: 12 }}>
          Field DB (AfriScout) feeds ADA directly — scrapers never overwrite it
        </div>
      </div>
    </div>
  );
}


// ── SQL Explorer Tab ───────────────────────────────────────────────────────────
function SQLExplorer({ dbs, initialDb, dbDetails, fetchDbDetails }) {
  const [selectedDb, setSelectedDb] = useState(initialDb || "main");
  const [sql, setSql] = useState(SAMPLE_SQL[initialDb] || SAMPLE_SQL.main);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadTables(selectedDb);
    fetchDbDetails(selectedDb);
  }, [selectedDb]);

  const loadTables = async (dbId) => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/db/${dbId}/tables`, { headers: H() });
      const d = await r.json();
      setTables(d.tables || []);
    } catch {}
  };

  const runQuery = async () => {
    if (!sql.trim()) return;
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/db/query`, {
        method: "POST",
        headers: H(),
        body: JSON.stringify({ db_id: selectedDb, sql, limit: 300 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Query failed");
      setResults(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const dbColor = COLORS[selectedDb] || "#64748b";
  const details = dbDetails[selectedDb];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      {/* Left: DB selector + table list */}
      <div>
        <div style={S.sideLabel}>Select Database</div>
        {Object.entries(dbs).map(([dbId, db]) => (
          <div key={dbId} onClick={() => {
            setSelectedDb(dbId);
            setSql(SAMPLE_SQL[dbId] || `SELECT * FROM scraped_datapoints LIMIT 20`);
            setResults(null);
          }}
            style={{
              ...S.dbSelectRow,
              background: selectedDb === dbId ? "#0d1929" : "transparent",
              borderLeft: `3px solid ${selectedDb === dbId ? COLORS[dbId] || "#64748b" : "transparent"}`,
            }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[dbId] || "#64748b", flexShrink: 0 }} />
            <div>
              <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>{db.label}</div>
              {db.configured && (
                <div style={{ color: "#475569", fontSize: 10 }}>{fmtMB(db.size_mb || 0)}</div>
              )}
            </div>
          </div>
        ))}

        {tables.length > 0 && (
          <>
            <div style={{ ...S.sideLabel, marginTop: 16 }}>Tables</div>
            {tables.map(t => (
              <div key={t.table_name}
                onClick={() => setSql(`SELECT * FROM ${t.table_name} LIMIT 20`)}
                style={S.tableRow}>
                <span style={{ color: dbColor, fontSize: 11 }}>{t.table_name}</span>
                <span style={{ color: "#475569", fontSize: 10 }}>{t.size}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Right: editor + results */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ ...S.dbBadge, background: `${dbColor}22`, color: dbColor, border: `1px solid ${dbColor}44` }}>
            {dbs[selectedDb]?.label || selectedDb}
          </div>
          {dbs[selectedDb]?.sacred && (
            <div style={{ ...S.sacredBadge, fontSize: 10 }}>READ ONLY — SACRED</div>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={runQuery} disabled={running} style={{
            ...S.runBtn,
            opacity: running ? 0.6 : 1,
          }}>
            {running ? "Running..." : "▶  Run Query"}
          </button>
        </div>

        {/* SQL textarea */}
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={e => setSql(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runQuery(); }}
          style={S.sqlEditor}
          placeholder="SELECT * FROM scraped_datapoints LIMIT 20"
          spellCheck={false}
        />
        <div style={{ color: "#475569", fontSize: 11, marginBottom: 12 }}>
          Ctrl+Enter to run · Read-only · Max 300 rows
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", background: "#1a0a0a", border: "1px solid #450a0a",
            borderRadius: 6, color: "#fca5a5", fontSize: 12, fontFamily: "monospace", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>
              {fmt(results.count)} rows returned
            </div>
            {results.rows && results.rows.length > 0 ? (
              <div style={S.tableWrapper}>
                <table style={S.resultTable}>
                  <thead>
                    <tr>
                      {Object.keys(results.rows[0]).map(col => (
                        <th key={col} style={S.th}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#080f1d" }}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} style={S.td}>
                            {val === null ? <span style={{ color: "#475569" }}>null</span>
                              : String(val).length > 60 ? String(val).slice(0, 60) + "…"
                              : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: "#475569", fontSize: 13 }}>No rows returned.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Price Changes Tab ──────────────────────────────────────────────────────────
function PriceChangesTab() {
  const [changes, setChanges] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChanges();
  }, [filter]);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const needsConf = filter === "pending" ? "?needs_confirmation=true" : "";
      const r = await fetch(`${API_BASE}/api/v1/admin/price-changes${needsConf}`, { headers: H() });
      const d = await r.json();
      setChanges(d.changes || []);
    } catch {} finally { setLoading(false); }
  };

  const confirm = async (item, county) => {
    const reason = prompt(`Confirm reason for price change:\n${item} [${county}]`);
    if (!reason) return;
    await fetch(`${API_BASE}/api/v1/admin/price-changes/confirm`, {
      method: "POST", headers: H(),
      body: JSON.stringify({ item, geography_county: county, confirmed_reason: reason }),
    });
    fetchChanges();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all","All Changes"],["pending","Needs Confirmation"]].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ ...S.filterBtn, ...(filter===id ? S.filterBtnActive : {}) }}>
            {label}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: "#475569" }}>Loading...</div> : (
        <div>
          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>
            {fmt(changes.length)} price changes
          </div>
          {changes.map((c, i) => {
            const up = (c.change_pct || 0) > 0;
            return (
              <div key={i} style={S.changeRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                    {c.item}
                    {c.geography_county && <span style={{ color: "#64748b", fontWeight: 400 }}> · {c.geography_county}</span>}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                    {c.change_reason || "Reason not detected"}
                    {c.needs_confirmation && !c.confirmed && (
                      <span style={{ color: "#FBBF24", marginLeft: 8 }}>⚠ Needs confirmation</span>
                    )}
                    {c.confirmed && (
                      <span style={{ color: "#10B981", marginLeft: 8 }}>✓ Confirmed by {c.confirmed_by}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 120 }}>
                  <div style={{ color: up ? "#10B981" : "#EF4444", fontWeight: 700, fontSize: 14 }}>
                    {up ? "↑" : "↓"} {Math.abs(c.change_pct || 0).toFixed(1)}%
                  </div>
                  <div style={{ color: "#475569", fontSize: 11 }}>
                    {fmt(c.old_value)} → {fmt(c.new_value)} KES
                  </div>
                </div>
                {c.needs_confirmation && !c.confirmed && (
                  <button onClick={() => confirm(c.item, c.geography_county)}
                    style={{ ...S.confirmBtn, marginLeft: 12 }}>
                    Confirm
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── Field Conflicts Tab ────────────────────────────────────────────────────────
function FieldConflictsTab() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/admin/field-conflicts`, { headers: H() })
      .then(r => r.json())
      .then(d => { setConflicts(d.conflicts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#475569" }}>Comparing field vs scraper data...</div>;

  return (
    <div>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>
        {conflicts.length} conflicts found — Field DB always wins. These are for awareness only.
      </div>
      {conflicts.length === 0 ? (
        <div style={{ color: "#10B981", fontSize: 14 }}>
          ✓ No conflicts — field data and scraper data are aligned
        </div>
      ) : conflicts.map((c, i) => {
        const fieldHigher = c.difference_pct > 0;
        return (
          <div key={i} style={S.changeRow}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                {c.item}
                {c.county && <span style={{ color: "#64748b" }}> · {c.county}</span>}
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                Field source: {c.field_source} · {c.field_date}
                <span style={{ color: "#10B981", marginLeft: 8 }}>Field value used</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700 }}>
                Field: {fmt(c.field_value)} KES
              </div>
              <div style={{ color: "#475569", fontSize: 12 }}>
                Scraper: {fmt(c.scraper_value)} KES ({fieldHigher ? "+" : ""}{c.difference_pct?.toFixed(1)}%)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ── ADA Progress Tab ───────────────────────────────────────────────────────────
function ADATab() {
  const [stats, setStats] = useState(null);
  const [sample, setSample] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/v1/admin/ada/stats`, { headers: H() }).then(r => r.json()),
      fetch(`${API_BASE}/api/v1/admin/ada/sample?limit=10`, { headers: H() }).then(r => r.json()),
    ]).then(([s, samp]) => {
      setStats(s);
      setSample(samp.rows || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#475569" }}>Loading ADA stats...</div>;

  if (!stats?.configured) return (
    <div style={{ padding: 24, background: "#0d1929", borderRadius: 12, border: "1px solid #1e2d4a" }}>
      <div style={{ color: "#F43F5E", fontWeight: 700, marginBottom: 8 }}>ADA Not Connected</div>
      <div style={{ color: "#64748b", fontSize: 13 }}>
        Add <code style={{ color: "#F43F5E" }}>ADA_DB_URL</code> to Render env vars to start accumulating.
        This is your own server or laptop Postgres instance.
      </div>
    </div>
  );

  const total = stats.total || 0;
  const milestones = stats.milestones || {};
  const levels = stats.by_level || {};
  const certColors = {
    standard: "#64748b", verified: "#60A5FA",
    cross_validated: "#F97316", field_confirmed: "#10B981",
  };

  return (
    <div>
      {/* Status banner */}
      <div style={{
        padding: "12px 20px", borderRadius: 10, marginBottom: 20,
        background: total >= 6000000 ? "#052e16" : "#0d1929",
        border: `1px solid ${total >= 6000000 ? "#10B981" : "#F43F5E"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ color: total >= 6000000 ? "#10B981" : "#F43F5E", fontWeight: 700, fontSize: 16 }}>
            {total >= 6000000 ? "✅ ADA READY — Open to AfriFoundry AI" : "Accumulating silently..."}
          </div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{stats.opens_at}</div>
        </div>
        <div style={{ color: "#e2e8f0", fontSize: 28, fontWeight: 800 }}>
          {fmt(total)}
        </div>
      </div>

      {/* Milestones */}
      <div style={S.milestonesGrid}>
        {Object.entries(milestones).map(([name, m]) => {
          const pct = Math.min(100, m.pct);
          const reached = m.current >= m.target;
          return (
            <div key={name} style={S.milestoneCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ color: reached ? "#10B981" : "#e2e8f0", fontWeight: 700 }}>
                  {reached ? "✅ " : ""}{name}
                </div>
                <div style={{ color: "#64748b", fontSize: 12 }}>{pct.toFixed(1)}%</div>
              </div>
              <div style={{ ...S.barTrack, marginTop: 8 }}>
                <div style={{ ...S.barFill, width: `${pct}%`,
                  background: reached ? "#10B981" : "#F43F5E" }} />
              </div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>
                {fmt(m.current)} / {fmt(m.target)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Certification breakdown */}
      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={S.cardTitle}>Certification Levels</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {Object.entries(levels).map(([level, count]) => (
            <div key={level} style={{ padding: "10px 14px", background: "#080f1d", borderRadius: 8,
              borderLeft: `3px solid ${certColors[level]}` }}>
              <div style={{ color: certColors[level], fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {level.replace("_", " ")}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                {fmt(count)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <div style={{ ...S.card, marginTop: 12 }}>
        <div style={S.cardTitle}>Coverage</div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            ["Countries", stats.coverage?.countries],
            ["Counties", stats.coverage?.counties],
            ["Sectors", stats.coverage?.sectors],
            ["Avg Confidence", (stats.avg_confidence * 100).toFixed(1) + "%"],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ color: "#64748b", fontSize: 11 }}>{label}</div>
              <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample */}
      {sample.length > 0 && (
        <div style={{ ...S.card, marginTop: 12 }}>
          <div style={S.cardTitle}>Recent Certified Datapoints</div>
          <div style={S.tableWrapper}>
            <table style={S.resultTable}>
              <thead>
                <tr>
                  {["Item","Value","County","Level","Confidence"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sample.map((r, i) => (
                  <tr key={i} style={{ background: i%2===0?"transparent":"#080f1d" }}>
                    <td style={S.td}>{String(r.item||"").slice(0,40)}</td>
                    <td style={S.td}>{fmt(r.value)} {r.unit}</td>
                    <td style={S.td}>{r.geography_county || "—"}</td>
                    <td style={{ ...S.td, color: certColors[r.certification_level] || "#64748b" }}>
                      {r.certification_level}
                    </td>
                    <td style={S.td}>{((r.confidence_score||0)*100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  page: { background: "#080f1d", minHeight: "100vh", padding: "24px 28px",
    fontFamily: "'JetBrains Mono','Fira Code',monospace", color: "#94a3b8" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  eyebrow: { color: "#F97316", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
    textTransform: "uppercase", marginBottom: 4 },
  title: { color: "#e2e8f0", fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" },
  subtitle: { color: "#475569", fontSize: 12, marginTop: 4 },
  refreshBtn: { padding: "8px 16px", background: "#0d1929", border: "1px solid #1e2d4a",
    color: "#94a3b8", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  tabs: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e2d4a", paddingBottom: 0 },
  tab: { padding: "8px 16px", background: "transparent", border: "none",
    borderBottom: "2px solid transparent", color: "#64748b", cursor: "pointer",
    fontSize: 12, fontFamily: "inherit", marginBottom: -1 },
  tabActive: { borderBottomColor: "#F97316", color: "#F97316" },
  content: {},
  dbGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 20 },
  dbCard: { padding: "14px 16px", background: "#0d1929", border: "1px solid #1e2d4a",
    borderTop: "3px solid", borderRadius: 10, transition: "background 0.15s" },
  dbLabel: { fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" },
  sacredBadge: { display: "inline-block", padding: "2px 6px", background: "#052e16",
    color: "#10B981", borderRadius: 4, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.1em", marginTop: 4 },
  barTrack: { height: 4, background: "#1e2d4a", borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  archBox: { padding: 16, background: "#0d1929", borderRadius: 10, border: "1px solid #1e2d4a" },
  archTitle: { color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 12 },
  archFlow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  // SQL Explorer
  sideLabel: { color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 8 },
  dbSelectRow: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
    borderRadius: 6, cursor: "pointer", marginBottom: 2, borderLeft: "3px solid transparent" },
  tableRow: { display: "flex", justifyContent: "space-between", padding: "5px 10px",
    cursor: "pointer", borderRadius: 4, fontSize: 12 },
  sqlEditor: { width: "100%", height: 160, background: "#0d1929", border: "1px solid #1e2d4a",
    borderRadius: 8, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace",
    fontSize: 12, padding: "12px 14px", resize: "vertical", boxSizing: "border-box",
    outline: "none", lineHeight: 1.6 },
  dbBadge: { padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 },
  runBtn: { padding: "8px 18px", background: "#F97316", color: "#fff", border: "none",
    borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  tableWrapper: { overflowX: "auto", borderRadius: 8, border: "1px solid #1e2d4a" },
  resultTable: { width: "100%", borderCollapse: "collapse", fontSize: 11 },
  th: { padding: "8px 12px", textAlign: "left", color: "#475569", fontSize: 10,
    fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #1e2d4a",
    background: "#0d1929", whiteSpace: "nowrap" },
  td: { padding: "8px 12px", color: "#94a3b8", borderBottom: "1px solid #080f1d",
    maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  // Changes
  changeRow: { display: "flex", alignItems: "center", padding: "12px 14px",
    background: "#0d1929", borderRadius: 8, border: "1px solid #1e2d4a",
    marginBottom: 6 },
  confirmBtn: { padding: "6px 12px", background: "#FBBF2422", color: "#FBBF24",
    border: "1px solid #FBBF2444", borderRadius: 6, cursor: "pointer", fontSize: 11 },
  filterBtn: { padding: "6px 14px", background: "#0d1929", border: "1px solid #1e2d4a",
    color: "#64748b", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  filterBtnActive: { background: "#1e2d4a", color: "#e2e8f0", borderColor: "#F97316" },
  // ADA
  milestonesGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  milestoneCard: { padding: "12px 14px", background: "#0d1929", border: "1px solid #1e2d4a", borderRadius: 8 },
  card: { padding: "14px 16px", background: "#0d1929", border: "1px solid #1e2d4a", borderRadius: 10 },
  cardTitle: { color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 12 },
};
