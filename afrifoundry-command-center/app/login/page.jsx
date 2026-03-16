'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.push('/bridge');
    } catch {
      setError('Connection error. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-brand-green/30 rounded-lg mb-4 bg-brand-green/5">
            <span className="text-brand-green text-xl">✦</span>
          </div>
          <h1 className="font-syne font-bold text-white text-lg">AFRIFOUNDRY</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mt-1">
            Command Center
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-surface-1 border border-border rounded-md px-3 py-2.5 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-brand-green/50 transition-colors"
              placeholder="mark@afrifoundry.com"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-1 border border-border rounded-md px-3 py-2.5 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-brand-green/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-mono text-[11px] text-brand-red bg-brand-red/5 border border-brand-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 hover:border-brand-green/50 text-brand-green font-mono text-[11px] uppercase tracking-widest py-3 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-brand-green/40 border-t-brand-green rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              '→ Access Command Center'
            )}
          </button>
        </form>

        <p className="text-center font-mono text-[9px] uppercase tracking-widest text-zinc-700 mt-8">
          AfriFoundry · Internal only · Not for distribution
        </p>
      </div>
    </div>
  );
}
