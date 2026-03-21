'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const TITLES = {
  '/bridge':         { title: 'Bridge',         sub: 'Platform health at a glance' },
  '/intelligence':   { title: 'Intelligence',   sub: 'Data engine — where the moat lives' },
  '/product':        { title: 'Product',        sub: 'AfriFoundry AI metrics' },
  '/scouts':         { title: 'Scouts',         sub: 'Field collection network' },
  '/company':        { title: 'Company',        sub: 'Business, revenue, funding' },
  '/users':          { title: 'Users',          sub: 'People and access management' },
  '/infrastructure': { title: 'Infrastructure', sub: 'Pipeline, scrapers, scheduler' },
  '/databases':      { title: 'Databases',      sub: '10 databases · 2.5M+ datapoints' },
  '/finetune':       { title: 'Fine-tuning',    sub: 'Gold conversations → AfriFoundry-1 model' },
  '/kenyatoday':     { title: 'Kenya Today',    sub: 'Live context injected into every conversation' },
  '/monitoring':     { title: 'Monitoring',     sub: 'API errors, security events, rate limits' },
  '/revenue':        { title: 'Revenue',         sub: 'MRR, subscribers, payments' },
};

export default function Topbar() {
  const pathname = usePathname();
  const page = TITLES[pathname] || { title: 'Command Center', sub: '' };
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }));
      setDate(n.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="font-syne font-bold text-white text-sm leading-none">{page.title}</h1>
        {page.sub && <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">{page.sub}</p>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-zinc-600">{date}</span>
        <span className="text-[10px] font-mono text-brand-green tabular-nums">{time}</span>
      </div>
    </header>
  );
}
