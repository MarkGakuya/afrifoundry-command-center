'use client';

// ─── StatusLight ──────────────────────────────────────────────────────────────
export function StatusLight({ status = 'unknown', label }) {
  const colors = {
    healthy: 'bg-brand-green shadow-[0_0_8px_#00ff88]',
    warning: 'bg-brand-amber shadow-[0_0_8px_#ffaa00]',
    error: 'bg-brand-red shadow-[0_0_8px_#ff4444]',
    unknown: 'bg-surface-4',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full inline-block ${colors[status]}`} />
      {label && <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">{label}</span>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`bg-surface-1 border border-border rounded-lg p-4 flex flex-col gap-1 ${accent ? 'border-brand-green/40' : ''}`}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</span>
      <span className={`text-2xl font-syne font-bold ${accent ? 'text-brand-green' : 'text-white'}`}>{value ?? '—'}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-surface-3 text-zinc-300',
    green: 'bg-brand-green/10 text-brand-green border border-brand-green/20',
    amber: 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20',
    red: 'bg-brand-red/10 text-brand-red border border-brand-red/20',
    blue: 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20',
  };
  return (
    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${variants[variant]}`}>
      {children}
    </span>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-400">{title}</h2>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows, onRowAction }) {
  if (!rows?.length) {
    return <div className="text-xs text-zinc-600 font-mono py-6 text-center">No data</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className="text-left text-zinc-500 uppercase tracking-widest pb-2 pr-4 font-normal">
                {col.label}
              </th>
            ))}
            {onRowAction && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="py-2 pr-4 text-zinc-300">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
              {onRowAction && (
                <td className="py-2 text-right">{onRowAction(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ label, value, max = 100, color = 'green' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    green: 'bg-brand-green',
    amber: 'bg-brand-amber',
    red: 'bg-brand-red',
    blue: 'bg-brand-blue',
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-zinc-400 w-28 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-zinc-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
export function ErrorState({ message = 'Failed to load data' }) {
  return (
    <div className="flex items-center justify-center h-40 text-brand-red/60 text-xs font-mono">
      {message}
    </div>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
export function ActionButton({ onClick, children, variant = 'default', disabled = false }) {
  const variants = {
    default: 'border-border text-zinc-300 hover:border-zinc-500 hover:text-white',
    green: 'border-brand-green/40 text-brand-green hover:bg-brand-green/10',
    red: 'border-brand-red/40 text-brand-red hover:bg-brand-red/10',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
