"use client";
import { useState, useEffect, useRef } from "react";

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const API_BASE   = process.env.NEXT_PUBLIC_API_BASE || "https://afrifoundry-api.onrender.com";
const API_TOKEN  = process.env.API_TOKEN || "";

const headers = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_TOKEN}`,
});

// ── HELPERS ────────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString();
const pct = (used, total) => total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

const TIER_COLORS = { 1: "#F97316", 2: "#FBBF24", 3: "#34D399", 4: "#60A5FA", 5: "#A78BFA" };
const TIER_LABELS = {
  1: "Kenya Industry",
  2: "Cross-cutting",
  3: "Regional Africa",
  4: "Life Data",
  5: "Depth & Granularity",
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function InfrastructurePage() {
  const [status,   setStatus]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [dbStats,  setDbStats]  = useState(null);
  const [scrapers, setScrapers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [running,  setRunning]  = useState(false);
  const [error,    setError]    = useState(null);
  const pollRef = useRef(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchStatus = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/pipeline/status`, { headers: headers() });
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      setStatus(d);
      setRunning(d.status === "running");
      return d;
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchHistory = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/pipeline/history`, { headers: headers() });
      const d = await r.json();
      setHistory(d.runs || []);
    } catch {}
  };

  const fetchDbStats = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/pipeline/db-stats`, { headers: headers() });
      const d = await r.json();
      setDbStats(d);
    } catch {}
  };

  const fetchScrapers = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/pipeline/scrapers`, { headers: headers() });
      const d = await r.json();
      setScrapers(d.scrapers || []);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchStatus(), fetchHistory(), fetchDbStats(), fetchScrapers()]);
      setLoading(false);
    };
    init();
  }, []);

  // Poll every 3s while running
  useEffect(() => {
    if (running) {
      pollRef.current = setInterval(async () => {
        const d = await fetchStatus();
        if (d?.status !== "running") {
          clearInterval(pollRef.current);
          fetchHistory();
          fetchDbStats();
          fetchScrapers();
        }
      }, 3000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [running]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const triggerRun = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/admin/pipeline/run`, {
        method: "POST", headers: headers(),
      });
      const d = await r.json();
      if (d.ok) {
        setRunning(true);
        fetchStatus();
      } else {
        alert(d.message || "Failed to start");
      }
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const toggleSchedule = async (enabled) => {
    try {
      await fetch(`${API_BASE}/api/v1/admin/pipeline/schedule?enabled=${enabled}`, {
        method: "POST", headers: headers(),
      });
      fetchStatus();
    } catch {}
  };

  if (loading) return <Loading />;

  const progress = status?.progress || {};
  const schedule = status?.schedule || {};

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerEyebrow}>AfriFoundry</div>
          <h1 style={styles.headerTitle}>Data Infrastructure</h1>
          <div style={styles.headerSub}>
            50 scrapers · 1,000,029 datapoints · 3 raw databases
          </div>
        </div>
        <RunButton running={running} onRun={triggerRun} />
      </div>

      {/* Status bar */}
      <StatusBar status={status} />

      {/* Live progress — only when running */}
      {running && <LiveProgress progress={progress} scrapers={scrapers} />}

      {/* 2-column grid */}
      <div style={styles.grid}>
        {/* DB Storage Gauges */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span style={styles.dot("#10B981")} />
            Database Storage
          </div>
          {dbStats ? (
            <div style={styles.gaugeGrid}>
              {Object.entries(dbStats).map(([key, db]) => (
                <DbGauge key={key} label={db.label} {...db} />
              ))}
            </div>
          ) : (
            <div style={styles.muted}>Loading DB stats...</div>
          )}
        </div>

        {/* Schedule */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span style={styles.dot("#F97316")} />
            Schedule
          </div>
          <div style={styles.scheduleBox}>
            <div style={styles.scheduleRow}>
              <span style={styles.label}>Status</span>
              <TogglePill
                active={schedule.enabled}
                onToggle={() => toggleSchedule(!schedule.enabled)}
                labelOn="Enabled"
                labelOff="Paused"
              />
            </div>
            <div style={styles.scheduleRow}>
              <span style={styles.label}>Frequency</span>
              <span style={styles.value}>Every Sunday, 2:00am EAT</span>
            </div>
            <div style={styles.scheduleRow}>
              <span style={styles.label}>Next run</span>
              <span style={styles.value}>
                {schedule.next_run
                  ? new Date(schedule.next_run).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
                  : "—"}
              </span>
            </div>
            <div style={styles.scheduleRow}>
              <span style={styles.label}>Last run</span>
              <span style={styles.value}>
                {history[0]?.started_at
                  ? new Date(history[0].started_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
                  : "Never"}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={styles.cardTitle}>
              <span style={styles.dot("#60A5FA")} />
              DB Routing
            </div>
            <div style={styles.routingTable}>
              {[
                ["Tier 1+2", "afrifoundry-raw", "~620K pts"],
                ["Tier 3+4", "afrifoundry-data2", "~91K pts"],
                ["Tier 5",   "afrifoundry-field", "~288K pts"],
              ].map(([tier, db, size]) => (
                <div key={tier} style={styles.routingRow}>
                  <span style={styles.routingTier}>{tier}</span>
                  <span style={styles.routingDb}>{db}</span>
                  <span style={styles.routingSize}>{size}</span>
                </div>
              ))}
              <div style={{ ...styles.routingRow, borderTop: "1px solid #1e2d4a", marginTop: 4, paddingTop: 8 }}>
                <span style={styles.routingTier}>Clean →</span>
                <span style={styles.routingDb}>afrifoundry-ai</span>
                <span style={styles.routingSize}>MAIN DB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper breakdown */}
      {scrapers.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <div style={styles.cardTitle}>
            <span style={styles.dot("#FBBF24")} />
            Last Run — Scraper Breakdown ({scrapers.length} scrapers)
          </div>
          <div style={styles.scraperGrid}>
            {scrapers.map((s) => (
              <ScraperRow key={s.scraper_id} scraper={s} />
            ))}
          </div>
        </div>
      )}

      {/* Run history */}
      {history.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <div style={styles.cardTitle}>
            <span style={styles.dot("#A78BFA")} />
            Run History
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Started", "Triggered by", "Status", "Scrapers", "Raw pts", "Inserted", "Duration"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((run, i) => (
                <tr key={i} style={i % 2 === 0 ? {} : { background: "#0d1929" }}>
                  <td style={styles.td}>
                    {new Date(run.started_at).toLocaleDateString("en-KE")}
                  </td>
                  <td style={styles.td}>{run.triggered_by}</td>
                  <td style={styles.td}>
                    <StatusBadge status={run.status} />
                  </td>
                  <td style={styles.td}>{run.scrapers_done}</td>
                  <td style={styles.td}>{fmt(run.datapoints_raw)}</td>
                  <td style={styles.td}>{fmt(run.datapoints_inserted)}</td>
                  <td style={styles.td}>{run.duration_minutes}min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

function RunButton({ running, onRun }) {
  return (
    <button
      onClick={onRun}
      disabled={running}
      style={{
        ...styles.runBtn,
        opacity: running ? 0.5 : 1,
        cursor: running ? "not-allowed" : "pointer",
        animation: running ? "pulse 2s infinite" : "none",
      }}
    >
      {running ? (
        <><Spinner /> Running...</>
      ) : (
        "▶  Run Pipeline Now"
      )}
    </button>
  );
}

function StatusBar({ status }) {
  if (!status) return null;
  const s = status.status;
  const colors = { idle: "#64748b", running: "#F97316", completed: "#10B981", failed: "#EF4444" };
  const color = colors[s] || "#64748b";
  return (
    <div style={{ ...styles.statusBar, borderColor: color }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color,
          animation: s === "running" ? "pulse 1.5s infinite" : "none" }} />
        <span style={{ color, fontWeight: 600, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em" }}>
          {s}
        </span>
        {status.triggered_by && (
          <span style={{ color: "#64748b", fontSize: 12 }}>· {status.triggered_by}</span>
        )}
      </div>
      {s === "running" && status.progress && (
        <div style={{ color: "#94a3b8", fontSize: 13 }}>
          {status.progress.current_scraper || "Initializing..."}
        </div>
      )}
    </div>
  );
}

function LiveProgress({ progress, scrapers }) {
  const done = progress.scrapers_done || 0;
  const total = progress.scrapers_total || 50;
  const pctDone = pct(done, total);

  return (
    <div style={styles.liveBox}>
      <div style={styles.liveHeader}>
        <div style={styles.liveTitle}>
          <span style={{ color: "#F97316" }}>●</span> Live Progress
        </div>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>
          {done}/{total} scrapers · {fmt(progress.datapoints_collected)} pts collected · {fmt(progress.datapoints_inserted)} inserted
        </div>
      </div>

      {/* Big progress bar */}
      <div style={styles.bigProgressTrack}>
        <div style={{ ...styles.bigProgressFill, width: `${pctDone}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12, color: "#64748b" }}>
        <span>{pctDone}% complete</span>
        <span>{total - done} scrapers remaining</span>
      </div>

      {/* Current scraper */}
      {progress.current_scraper && (
        <div style={styles.currentScraper}>
          <span style={{ color: "#F97316" }}>→</span> {progress.current_scraper}
        </div>
      )}

      {/* Errors */}
      {progress.errors?.length > 0 && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#1a0a0a", borderRadius: 6, border: "1px solid #450a0a" }}>
          <div style={{ color: "#EF4444", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            {progress.errors.length} error(s)
          </div>
          {progress.errors.slice(0, 3).map((e, i) => (
            <div key={i} style={{ color: "#fca5a5", fontSize: 11, fontFamily: "monospace" }}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DbGauge({ label, count, size_mb, size_pretty, unprocessed, error }) {
  const MAX_MB = 480; // Free Neon limit ~512MB, warn at 480
  const usedPct = pct(size_mb, MAX_MB);
  const color = usedPct > 85 ? "#EF4444" : usedPct > 65 ? "#FBBF24" : "#10B981";

  return (
    <div style={styles.gauge}>
      <div style={styles.gaugeLabel}>{label}</div>
      {error ? (
        <div style={{ color: "#64748b", fontSize: 12 }}>{error}</div>
      ) : (
        <>
          <div style={styles.gaugeNumbers}>
            <span style={{ color: "#e2e8f0" }}>{fmt(count)}</span>
            <span style={{ color: "#64748b" }}> pts</span>
            <span style={{ color: "#64748b", marginLeft: 8 }}>{size_pretty || `${size_mb}MB`}</span>
          </div>
          {unprocessed > 0 && (
            <div style={{ color: "#FBBF24", fontSize: 11, marginBottom: 4 }}>
              {fmt(unprocessed)} unprocessed
            </div>
          )}
          <div style={styles.gaugeTrack}>
            <div style={{ ...styles.gaugeFill, width: `${usedPct}%`, background: color }} />
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
            {usedPct}% of 512 MB
          </div>
        </>
      )}
    </div>
  );
}

function ScraperRow({ scraper }) {
  const tier = scraper.tier || 1;
  const color = TIER_COLORS[tier] || "#64748b";
  const ok = scraper.status === "ok";
  return (
    <div style={{ ...styles.scraperRow, borderLeftColor: color }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700 }}>
            {scraper.scraper_id}
          </span>
          <div style={{ color: "#e2e8f0", fontSize: 12, marginTop: 2, maxWidth: 200 }}>
            {scraper.name?.replace(/— .+/, "").trim().slice(0, 35)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: ok ? "#10B981" : "#EF4444", fontSize: 11, fontWeight: 600 }}>
            {ok ? "✓" : "✗"}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>
            {fmt(scraper.inserted)} pts
          </div>
        </div>
      </div>
      {scraper.error && (
        <div style={{ color: "#fca5a5", fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>
          {scraper.error.slice(0, 80)}
        </div>
      )}
    </div>
  );
}

function TogglePill({ active, onToggle, labelOn, labelOff }) {
  return (
    <button onClick={onToggle} style={{
      padding: "4px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
      background: active ? "#052e16" : "#1e2d4a",
      color: active ? "#10B981" : "#64748b",
    }}>
      {active ? labelOn : labelOff}
    </button>
  );
}

function StatusBadge({ status }) {
  const colors = { running: "#F97316", completed: "#10B981", failed: "#EF4444", idle: "#64748b" };
  const color = colors[status] || "#64748b";
  return (
    <span style={{ color, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #F97316",
      borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite",
      marginRight: 6 }} />
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: 300, color: "#64748b", fontSize: 14 }}>
      Loading infrastructure...
    </div>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const styles = {
  page: { background: "#080f1d", minHeight: "100vh", padding: "24px 28px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#94a3b8" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24 },
  headerEyebrow: { color: "#F97316", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
    textTransform: "uppercase", marginBottom: 4 },
  headerTitle: { color: "#e2e8f0", fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" },
  headerSub: { color: "#475569", fontSize: 12, marginTop: 4 },

  runBtn: { display: "flex", alignItems: "center", gap: 6, padding: "12px 24px",
    background: "#F97316", color: "#fff", border: "none", borderRadius: 8, fontSize: 14,
    fontWeight: 700, letterSpacing: "0.03em", transition: "all 0.15s" },

  statusBar: { padding: "10px 16px", borderRadius: 8, border: "1px solid",
    background: "#0d1929", marginBottom: 16, display: "flex", justifyContent: "space-between",
    alignItems: "center" },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  card: { background: "#0d1929", border: "1px solid #1e2d4a", borderRadius: 12, padding: 20 },
  cardTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700,
    color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 },

  dot: (color) => ({ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }),

  gaugeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  gauge: { padding: "12px 14px", background: "#080f1d", borderRadius: 8, border: "1px solid #1e2d4a" },
  gaugeLabel: { fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 },
  gaugeNumbers: { fontSize: 13, marginBottom: 6 },
  gaugeTrack: { height: 4, background: "#1e2d4a", borderRadius: 2, overflow: "hidden" },
  gaugeFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },

  scheduleBox: { display: "flex", flexDirection: "column", gap: 12 },
  scheduleRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 12, color: "#64748b" },
  value: { fontSize: 12, color: "#e2e8f0" },

  routingTable: { marginTop: 8 },
  routingRow: { display: "flex", gap: 12, padding: "5px 0", fontSize: 12,
    borderBottom: "1px solid #0d1929" },
  routingTier: { width: 70, color: "#94a3b8", fontWeight: 600 },
  routingDb: { flex: 1, color: "#60A5FA", fontFamily: "monospace" },
  routingSize: { color: "#475569", fontSize: 11 },

  liveBox: { background: "#0d1929", border: "1px solid #F97316", borderRadius: 12,
    padding: 20, marginBottom: 16 },
  liveHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  liveTitle: { fontSize: 13, fontWeight: 700, color: "#e2e8f0", display: "flex",
    alignItems: "center", gap: 8 },
  bigProgressTrack: { height: 10, background: "#1e2d4a", borderRadius: 5, overflow: "hidden" },
  bigProgressFill: { height: "100%", background: "linear-gradient(90deg, #F97316, #FBBF24)",
    borderRadius: 5, transition: "width 0.5s ease" },
  currentScraper: { marginTop: 10, padding: "8px 12px", background: "#080f1d",
    borderRadius: 6, fontSize: 12, color: "#e2e8f0", fontFamily: "monospace" },

  scraperGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 },
  scraperRow: { padding: "10px 12px", background: "#080f1d", borderRadius: 6,
    borderLeft: "3px solid", transition: "background 0.15s" },

  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { textAlign: "left", padding: "8px 12px", color: "#475569", fontSize: 11,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: "1px solid #1e2d4a" },
  td: { padding: "10px 12px", color: "#94a3b8", borderBottom: "1px solid #0d1929" },

  muted: { color: "#475569", fontSize: 13 },
};
