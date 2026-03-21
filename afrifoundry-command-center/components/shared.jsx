'use client';

export function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
    </div>
  );
}

export function ErrState({ msg, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <span className="font-mono text-[11px] text-red-400">⚠ {msg || 'Failed to load'}</span>
      {onRetry && (
        <button onClick={onRetry}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-border px-3 py-1.5 rounded transition-colors">
          Retry
        </button>
      )}
    </div>
  );
}

export function Mono({ children, className = '' }) {
  return <span className={`font-mono ${className}`}>{children}</span>;
}

export function Label({ children }) {
  return <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">{children}</span>;
}

export function Section({ title, sub, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">{title}</div>
          {sub && <div className="font-mono text-[9px] text-zinc-700 mt-0.5">{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, accent = false, className = '' }) {
  return (
    <div className={`bg-surface-1 border rounded-lg ${accent ? 'border-brand-green/30' : 'border-border'} ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value, accent = false, sub }) {
  return (
    <Card accent={accent} className="p-4 flex flex-col gap-1">
      <Label>{label}</Label>
      <span className={`font-syne font-bold text-xl leading-none mt-1 ${accent ? 'text-brand-green' : 'text-white'}`}>
        {value ?? '—'}
      </span>
      {sub && <span className="font-mono text-[9px] text-zinc-600 mt-0.5">{sub}</span>}
    </Card>
  );
}

export function Dot({ status }) {
  const c = {
    healthy: 'bg-emerald-400 shadow-[0_0_5px_#34d399]',
    warning: 'bg-amber-400 shadow-[0_0_5px_#fbbf24]',
    error:   'bg-red-500 shadow-[0_0_5px_#f87171]',
    active:  'bg-emerald-400 shadow-[0_0_5px_#34d399]',
    idle:    'bg-zinc-600',
    unknown: 'bg-zinc-700',
  };
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${c[status] || c.unknown}`} />;
}

export function Pill({ children, color = 'default' }) {
  const c = {
    green:   'bg-brand-green/10 text-brand-green border-brand-green/20',
    amber:   'bg-amber-400/10 text-amber-400 border-amber-400/20',
    red:     'bg-red-500/10 text-red-400 border-red-500/20',
    blue:    'bg-blue-400/10 text-blue-400 border-blue-400/20',
    default: 'bg-surface-3 text-zinc-400 border-transparent',
  };
  return (
    <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border ${c[color]}`}>
      {children}
    </span>
  );
}

export function Btn({ children, onClick, variant = 'default', disabled = false, small = false }) {
  const v = {
    default: 'border-border text-zinc-400 hover:border-zinc-500 hover:text-white',
    green:   'border-brand-green/30 text-brand-green hover:bg-brand-green/10',
    red:     'border-red-500/30 text-red-400 hover:bg-red-500/10',
    amber:   'border-amber-400/30 text-amber-400 hover:bg-amber-400/10',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`font-mono uppercase tracking-widest border rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${small ? 'text-[9px] px-2 py-1' : 'text-[10px] px-3 py-1.5'} ${v[variant]}`}>
      {children}
    </button>
  );
}

export function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
export function pct(n) { return n != null ? `${Number(n).toFixed(1)}%` : '—'; }
