'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/bridge', label: 'Bridge', icon: '◈', roles: ['admin'] },
  { href: '/intelligence', label: 'Intelligence', icon: '⬡', roles: ['admin', 'data'] },
  { href: '/product', label: 'Product', icon: '◎', roles: ['admin', 'product'] },
  { href: '/scouts', label: 'Scouts', icon: '◉', roles: ['admin', 'scout'] },
  { href: '/company', label: 'Company', icon: '◇', roles: ['admin'] },
  { href: '/users', label: 'Users', icon: '◌', roles: ['admin'] },
];

export default function Sidebar({ role = 'admin' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const NavItems = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-brand-green font-mono text-lg">✦</span>
          <div>
            <div className="text-white font-syne font-bold text-sm leading-none">AFRIFOUNDRY</div>
            <div className="text-zinc-600 font-mono text-[9px] uppercase tracking-widest mt-0.5">Command Center</div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group ${
                active
                  ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-surface-2'
              }`}
            >
              <span className={`font-mono text-base ${active ? 'text-brand-green' : 'text-zinc-600 group-hover:text-zinc-300'}`}>
                {item.icon}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest">{item.label}</span>
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-brand-green" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 mb-3">
          {role.toUpperCase()} · ONLINE
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-brand-red transition-colors disabled:opacity-30"
        >
          {loggingOut ? 'Signing out...' : '→ Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-zinc-400 hover:text-white bg-surface-1 border border-border rounded p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="font-mono text-sm">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-52 bg-surface-1 border-r border-border flex flex-col z-40 transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <NavItems />
      </aside>
    </>
  );
}
