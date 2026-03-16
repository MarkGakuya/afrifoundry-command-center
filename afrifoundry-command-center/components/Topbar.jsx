'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES = {
  '/bridge': { title: 'Bridge', sub: 'Platform health at a glance' },
  '/intelligence': { title: 'Intelligence', sub: 'Data engine — where the moat lives' },
  '/product': { title: 'Product', sub: 'AfriFoundry AI metrics' },
  '/scouts': { title: 'Scouts', sub: 'Field collection network' },
  '/company': { title: 'Company', sub: 'Business, revenue, funding' },
  '/users': { title: 'Users', sub: 'People and access management' },
};

export default function Topbar() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] || { title: 'Command Center', sub: '' };

  const now = new Date();
  const time = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="font-syne font-bold text-white text-sm leading-none">{page.title}</h1>
        {page.sub && <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">{page.sub}</p>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-zinc-600">{date}</span>
        <span className="text-xs font-mono text-brand-green">{time}</span>
      </div>
    </header>
  );
}
